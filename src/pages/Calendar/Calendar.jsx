import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  GraduationCap,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
  Video,
} from "lucide-react"

import { getMyTutoringSessions } from "../../services/tutoringService"

const statusStyles = {
  scheduled: {
    label: "Programada",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "En curso",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completada",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelada",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
  not_completed: {
    label: "No completada",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-500",
  },
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function pad(value) {
  return String(value).padStart(2, "0")
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function normalizeSessionDate(value) {
  if (!value) return null
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatTime(value) {
  if (!value) return "Hora pendiente"
  return value.slice(0, 5)
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatLongDate(value) {
  const date = normalizeSessionDate(value)
  if (!date) return "Fecha pendiente"

  return new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
}

function getPersonName(session) {
  const person =
    session.currentUserRole === "student" ? session.tutor : session.student

  const name = `${person?.first_name || ""} ${person?.last_name || ""}`.trim()
  return name || "Estudiante de AulaConecta"
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const mondayIndex = (firstDay.getDay() + 6) % 7
  const days = []

  for (let index = mondayIndex - 1; index >= 0; index -= 1) {
    const date = new Date(year, month, -index)
    days.push({ date, currentMonth: false })
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push({ date: new Date(year, month, day), currentMonth: true })
  }

  let nextDay = 1
  while (days.length % 7 !== 0 || days.length < 42) {
    days.push({ date: new Date(year, month + 1, nextDay), currentMonth: false })
    nextDay += 1
  }

  return days
}

function Calendar() {
  const today = useMemo(() => new Date(), [])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(toDateKey(today))
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [search, setSearch] = useState("")

  async function loadSessions() {
    setLoading(true)
    setError("")

    try {
      const data = await getMyTutoringSessions()
      setSessions(data)
    } catch (loadError) {
      console.error(loadError)
      setError("No pudimos cargar tus tutorías. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const filteredSessions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return sessions.filter((session) => {
      const matchesStatus =
        statusFilter === "all" || session.status === statusFilter
      const matchesRole =
        roleFilter === "all" || session.currentUserRole === roleFilter
      const searchable = [
        session.subject?.name,
        session.subject?.code,
        getPersonName(session),
        session.location_or_link,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return (
        matchesStatus &&
        matchesRole &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      )
    })
  }, [sessions, statusFilter, roleFilter, search])

  const sessionsByDate = useMemo(() => {
    return filteredSessions.reduce((accumulator, session) => {
      if (!accumulator[session.session_date]) {
        accumulator[session.session_date] = []
      }
      accumulator[session.session_date].push(session)
      return accumulator
    }, {})
  }, [filteredSessions])

  const selectedSessions = sessionsByDate[selectedDate] || []
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth])

  const upcomingSessions = useMemo(() => {
    const nowKey = toDateKey(today)

    return sessions
      .filter(
        (session) =>
          session.session_date >= nowKey &&
          ["scheduled", "in_progress"].includes(session.status),
      )
      .sort((a, b) => {
        const first = `${a.session_date}T${a.start_time || "00:00"}`
        const second = `${b.session_date}T${b.start_time || "00:00"}`
        return first.localeCompare(second)
      })
  }, [sessions, today])

  const stats = useMemo(() => {
    const monthPrefix = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}`
    const inMonth = sessions.filter((session) =>
      session.session_date?.startsWith(monthPrefix),
    )

    return {
      month: inMonth.length,
      upcoming: upcomingSessions.length,
      completed: sessions.filter((session) => session.status === "completed").length,
      asTutor: sessions.filter((session) => session.currentUserRole === "tutor").length,
    }
  }, [sessions, currentMonth, upcomingSessions])

  function changeMonth(offset) {
    setCurrentMonth(
      (previous) => new Date(previous.getFullYear(), previous.getMonth() + offset, 1),
    )
  }

  function goToToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(toDateKey(today))
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-200/70 sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              <CalendarDays size={15} /> Agenda académica
            </div>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              Organiza tus tutorías en un solo lugar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Consulta tus sesiones por fecha, identifica tus próximos encuentros y mantén tu agenda académica al día.
            </p>
          </div>

          <Link
            to="/dashboard/tutorias"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Ver mis tutorías <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Este mes", stats.month, CalendarDays, "text-blue-600", "bg-blue-50"],
          ["Próximas", stats.upcoming, Clock3, "text-amber-600", "bg-amber-50"],
          ["Completadas", stats.completed, CheckCircle2, "text-emerald-600", "bg-emerald-50"],
          ["Como tutor", stats.asTutor, GraduationCap, "text-indigo-600", "bg-indigo-50"],
        ].map(([label, value, Icon, iconColor, iconBg]) => (
          <article key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
              </div>
              <div className={`rounded-2xl p-3 ${iconBg} ${iconColor}`}>
                <Icon size={23} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por materia, código o estudiante..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Todos los estados</option>
            <option value="scheduled">Programadas</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Todos mis roles</option>
            <option value="student">Como estudiante</option>
            <option value="tutor">Como tutor</option>
          </select>

          <button
            type="button"
            onClick={loadSessions}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} /> Actualizar
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Vista mensual</p>
              <h2 className="mt-1 text-2xl font-black capitalize text-slate-950">{formatMonth(currentMonth)}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changeMonth(-1)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50" aria-label="Mes anterior">
                <ArrowLeft size={18} />
              </button>
              <button type="button" onClick={goToToday} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                Hoy
              </button>
              <button type="button" onClick={() => changeMonth(1)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50" aria-label="Mes siguiente">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-xs">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="grid min-h-[440px] place-items-center p-8">
              <div className="text-center">
                <RefreshCw className="mx-auto animate-spin text-blue-600" size={28} />
                <p className="mt-3 text-sm font-semibold text-slate-500">Cargando tu agenda...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, currentMonth: isCurrentMonth }) => {
                const key = toDateKey(date)
                const daySessions = sessionsByDate[key] || []
                const isToday = key === toDateKey(today)
                const isSelected = key === selectedDate

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={`min-h-24 border-b border-r border-slate-100 p-2 text-left transition sm:min-h-28 sm:p-3 ${
                      isSelected ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : "hover:bg-slate-50"
                    } ${!isCurrentMonth ? "bg-slate-50/60 text-slate-400" : "text-slate-800"}`}
                  >
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ${isToday ? "bg-slate-950 text-white" : ""}`}>
                      {date.getDate()}
                    </span>

                    <div className="mt-2 space-y-1">
                      {daySessions.slice(0, 2).map((session) => {
                        const style = statusStyles[session.status] || statusStyles.scheduled
                        return (
                          <div key={session.id} className="flex items-center gap-1.5 truncate rounded-lg bg-white/90 px-1.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                            <span className="truncate">{formatTime(session.start_time)} {session.subject?.code || session.subject?.name}</span>
                          </div>
                        )
                      })}
                      {daySessions.length > 2 && (
                        <p className="pl-1 text-[10px] font-black text-blue-600">+{daySessions.length - 2} más</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Día seleccionado</p>
                <h2 className="mt-1 text-xl font-black capitalize text-slate-950">{formatLongDate(selectedDate)}</h2>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <CalendarDays size={21} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <CalendarDays className="mx-auto text-slate-400" size={28} />
                  <p className="mt-3 text-sm font-black text-slate-700">No hay tutorías este día</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Selecciona otra fecha para revisar tu agenda.</p>
                </div>
              ) : (
                selectedSessions.map((session) => {
                  const style = statusStyles[session.status] || statusStyles.scheduled
                  const isVirtual = session.modality === "virtual"

                  return (
                    <article key={session.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{session.subject?.name || "Tutoría académica"}</p>
                          <p className="mt-1 text-xs font-bold text-blue-600">{session.subject?.code || "Sin código"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
                        <p className="flex items-center gap-2"><Clock3 size={15} className="text-slate-400" /> {formatTime(session.start_time)} – {formatTime(session.end_time)}</p>
                        <p className="flex items-center gap-2"><UserRound size={15} className="text-slate-400" /> {session.currentUserRole === "student" ? "Tutor" : "Estudiante"}: {getPersonName(session)}</p>
                        <p className="flex items-center gap-2">{isVirtual ? <Video size={15} className="text-slate-400" /> : <MapPin size={15} className="text-slate-400" />} {isVirtual ? "Virtual" : session.location_or_link || "Ubicación pendiente"}</p>
                      </div>

                      {isVirtual && session.location_or_link && (
                        <a href={session.location_or_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700">
                          Abrir enlace <ExternalLink size={14} />
                        </a>
                      )}
                    </article>
                  )
                })
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-200/70 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Próxima sesión</p>
                <h2 className="mt-1 text-xl font-black">Tu siguiente encuentro</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-blue-300"><Clock3 size={21} /></div>
            </div>

            {upcomingSessions[0] ? (
              <div className="mt-5">
                <p className="text-lg font-black">{upcomingSessions[0].subject?.name || "Tutoría académica"}</p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-300">{formatLongDate(upcomingSessions[0].session_date)}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Horario</p>
                    <p className="mt-1 text-sm font-black">{formatTime(upcomingSessions[0].start_time)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rol</p>
                    <p className="mt-1 text-sm font-black">{upcomingSessions[0].currentUserRole === "student" ? "Estudiante" : "Tutor"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-slate-300">No tienes tutorías próximas. Explora solicitudes para encontrar una nueva oportunidad de aprendizaje.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

export default Calendar
