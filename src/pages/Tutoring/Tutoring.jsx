import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Laptop,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react"

import ReviewModal from "../../components/Reviews/ReviewModal"
import { getReviewForSession } from "../../services/reviewService"
import {
  getMyTutoringSessions,
  updateTutoringStatus,
} from "../../services/tutoringService"

const statusInformation = {
  scheduled: {
    label: "Programada",
    styles: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "En curso",
    styles: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completada",
    styles: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelada",
    styles: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  not_completed: {
    label: "No realizada",
    styles: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
}

const filterOptions = [
  { value: "all", label: "Todas" },
  { value: "scheduled", label: "Programadas" },
  { value: "in_progress", label: "En curso" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
]

function formatDate(date) {
  if (!date) return "Fecha por confirmar"

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatShortDate(date) {
  if (!date) return "Por confirmar"

  return new Intl.DateTimeFormat("es-EC", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  return time?.slice(0, 5) || "--:--"
}

function getSessionTimestamp(session) {
  if (!session.session_date) return Number.POSITIVE_INFINITY
  return new Date(
    `${session.session_date}T${session.start_time || "00:00:00"}`,
  ).getTime()
}

function StatCard({ icon: Icon, label, value, description, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className={`rounded-2xl p-3 ring-1 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </article>
  )
}

function Tutoring() {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [checkingReviewId, setCheckingReviewId] = useState(null)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  async function loadSessions() {
    setLoading(true)
    setMessage("")
    setMessageType("")

    try {
      const data = await getMyTutoringSessions()
      setSessions(data)
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron cargar las tutorías.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const stats = useMemo(() => {
    const now = Date.now()

    return {
      total: sessions.length,
      upcoming: sessions.filter(
        (session) =>
          session.status === "scheduled" &&
          getSessionTimestamp(session) >= now,
      ).length,
      active: sessions.filter((session) => session.status === "in_progress")
        .length,
      completed: sessions.filter((session) => session.status === "completed")
        .length,
      asTutor: sessions.filter((session) => session.currentUserRole === "tutor")
        .length,
    }
  }, [sessions])

  const nextSession = useMemo(() => {
    const now = Date.now()
    return [...sessions]
      .filter(
        (session) =>
          ["scheduled", "in_progress"].includes(session.status) &&
          getSessionTimestamp(session) >= now - 60 * 60 * 1000,
      )
      .sort((a, b) => getSessionTimestamp(a) - getSessionTimestamp(b))[0]
  }, [sessions])

  const filteredSessions = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()

    return sessions.filter((session) => {
      const otherPerson =
        session.currentUserRole === "student" ? session.tutor : session.student
      const otherPersonName = otherPerson
        ? `${otherPerson.first_name} ${otherPerson.last_name}`
        : ""

      const matchesStatus =
        statusFilter === "all" || session.status === statusFilter
      const matchesRole =
        roleFilter === "all" || session.currentUserRole === roleFilter
      const matchesSearch =
        !cleanSearch ||
        session.subject?.name?.toLowerCase().includes(cleanSearch) ||
        session.subject?.code?.toLowerCase().includes(cleanSearch) ||
        otherPersonName.toLowerCase().includes(cleanSearch) ||
        session.location_or_link?.toLowerCase().includes(cleanSearch)

      return matchesStatus && matchesRole && matchesSearch
    })
  }, [sessions, statusFilter, roleFilter, searchTerm])

  async function handleStatusChange(sessionId, status) {
    const confirmationMessages = {
      completed: "¿Deseas marcar esta tutoría como completada?",
      cancelled: "¿Deseas cancelar esta tutoría?",
      in_progress: "¿Deseas iniciar esta tutoría?",
    }

    const confirmed = window.confirm(
      confirmationMessages[status] ||
        "¿Deseas actualizar el estado de esta tutoría?",
    )

    if (!confirmed) return

    setProcessingId(sessionId)
    setMessage("")
    setMessageType("")

    try {
      await updateTutoringStatus(sessionId, status)

      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session.id === sessionId ? { ...session, status } : session,
        ),
      )

      setMessage("Estado de la tutoría actualizado correctamente.")
      setMessageType("success")
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo actualizar la tutoría.")
      setMessageType("error")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleOpenReview(session) {
    setCheckingReviewId(session.id)
    setMessage("")
    setMessageType("")

    try {
      const existingReview = await getReviewForSession(session.id)

      if (existingReview) {
        setMessage("Ya calificaste esta tutoría anteriormente.")
        setMessageType("error")
        return
      }

      setSelectedSession(session)
    } catch (error) {
      console.error(error)
      setMessage(
        error.message ||
          "No se pudo comprobar la calificación de esta tutoría.",
      )
      setMessageType("error")
    } finally {
      setCheckingReviewId(null)
    }
  }

  function clearFilters() {
    setStatusFilter("all")
    setRoleFilter("all")
    setSearchTerm("")
  }

  return (
    <>
      <main className="px-5 py-8 sm:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8 lg:px-10">
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                  <Sparkles size={15} /> Agenda académica
                </div>
                <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                  Organiza tus tutorías sin perder ningún detalle
                </h1>
                <p className="mt-3 max-w-xl leading-7 text-slate-300">
                  Consulta tus sesiones como estudiante o tutor, actualiza su
                  estado y comparte una calificación al finalizar.
                </p>
              </div>

              <button
                type="button"
                onClick={loadSessions}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Actualizar agenda
              </button>
            </div>
          </div>

          {message && (
            <div
              role="alert"
              className={`mt-6 rounded-2xl border px-5 py-4 font-medium ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              label="Sesiones totales"
              value={stats.total}
              description="Todas tus participaciones registradas"
              tone="blue"
            />
            <StatCard
              icon={Clock}
              label="Próximas"
              value={stats.upcoming}
              description="Tutorías programadas por realizar"
              tone="amber"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completadas"
              value={stats.completed}
              description="Sesiones finalizadas correctamente"
              tone="emerald"
            />
            <StatCard
              icon={GraduationCap}
              label="Como tutor"
              value={stats.asTutor}
              description="Veces que has ayudado a otros estudiantes"
              tone="violet"
            />
          </div>

          {nextSession && (
            <section className="mt-6 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                    Próxima sesión
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    {nextSession.subject?.name || "Tutoría académica"}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-50">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={17} />
                      {formatShortDate(nextSession.session_date)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock size={17} />
                      {formatTime(nextSession.start_time)} - {formatTime(nextSession.end_time)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {nextSession.modality === "virtual" ? (
                        <Laptop size={17} />
                      ) : (
                        <MapPin size={17} />
                      )}
                      {nextSession.modality === "virtual" ? "Virtual" : "Presencial"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                    Tu participación
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {nextSession.currentUserRole === "student"
                      ? "Estudiante"
                      : "Tutor"}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Tu agenda</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mostrando {filteredSessions.length} de {sessions.length} sesiones.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row">
                <label className="relative block min-w-0 lg:w-72">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar materia o persona..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Todos los roles</option>
                  <option value="student">Como estudiante</option>
                  <option value="tutor">Como tutor</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    statusFilter === option.value
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="mt-10 rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 font-medium text-slate-600">Cargando tutorías...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <GraduationCap size={34} />
              </div>
              <h2 className="mt-5 text-xl font-black text-slate-900">
                Todavía no tienes tutorías
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate-500">
                Cuando aceptes una postulación o te elijan como tutor, la sesión aparecerá aquí.
              </p>
              <Link
                to="/dashboard/solicitudes"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Explorar solicitudes <ArrowRight size={18} />
              </Link>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Search size={34} className="mx-auto text-slate-400" />
              <h2 className="mt-4 text-xl font-black text-slate-900">
                No encontramos coincidencias
              </h2>
              <p className="mt-2 text-slate-500">
                Cambia la búsqueda o limpia los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <X size={18} /> Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {filteredSessions.map((session) => {
                const status =
                  statusInformation[session.status] || statusInformation.scheduled
                const otherPerson =
                  session.currentUserRole === "student"
                    ? session.tutor
                    : session.student
                const otherPersonName = otherPerson
                  ? `${otherPerson.first_name} ${otherPerson.last_name}`
                  : "Usuario de AulaConecta"
                const canManage = ["scheduled", "in_progress"].includes(
                  session.status,
                )
                const isProcessing = processingId === session.id
                const isCheckingReview = checkingReviewId === session.id

                return (
                  <article
                    key={session.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                    <div className="p-6 sm:p-7">
                      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                              {session.subject?.code || "MATERIA"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status.styles}`}
                            >
                              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                              {session.currentUserRole === "student"
                                ? "Participas como estudiante"
                                : "Participas como tutor"}
                            </span>
                          </div>

                          <h3 className="mt-4 text-2xl font-black text-slate-900">
                            {session.subject?.name || "Tutoría académica"}
                          </h3>

                          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                              <CalendarDays size={18} className="shrink-0 text-blue-600" />
                              <span>{formatDate(session.session_date)}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                              <Clock size={18} className="shrink-0 text-blue-600" />
                              <span>
                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                              {session.modality === "virtual" ? (
                                <Laptop size={18} className="shrink-0 text-blue-600" />
                              ) : (
                                <MapPin size={18} className="shrink-0 text-blue-600" />
                              )}
                              <span>
                                {session.modality === "virtual" ? "Virtual" : "Presencial"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                              <User size={18} className="shrink-0 text-blue-600" />
                              <span className="truncate">{otherPersonName}</span>
                            </div>
                          </div>

                          {session.location_or_link && (
                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                              <MapPin size={18} className="mt-0.5 shrink-0 text-blue-600" />
                              {session.modality === "virtual" &&
                              /^https?:\/\//i.test(session.location_or_link) ? (
                                <a
                                  href={session.location_or_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="break-all font-semibold text-blue-600 hover:underline"
                                >
                                  {session.location_or_link}
                                </a>
                              ) : (
                                <span className="break-all">{session.location_or_link}</span>
                              )}
                            </div>
                          )}

                          {session.notes && (
                            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                              <span className="font-bold">Notas:</span>{" "}
                              <span className="whitespace-pre-line">{session.notes}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-3 sm:flex-row xl:w-56 xl:flex-col">
                          {session.status === "scheduled" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(session.id, "in_progress")
                              }
                              disabled={isProcessing}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Clock size={18} />
                              {isProcessing ? "Procesando..." : "Iniciar tutoría"}
                            </button>
                          )}

                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(session.id, "completed")
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <CheckCircle2 size={18} />
                                {isProcessing ? "Procesando..." : "Completar"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(session.id, "cancelled")
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <XCircle size={18} /> Cancelar
                              </button>
                            </>
                          )}

                          {session.status === "completed" && (
                            <button
                              type="button"
                              onClick={() => handleOpenReview(session)}
                              disabled={isCheckingReview}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                            >
                              <Star size={18} />
                              {isCheckingReview ? "Comprobando..." : "Calificar tutoría"}
                            </button>
                          )}

                          {["cancelled", "not_completed"].includes(session.status) && (
                            <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-500">
                              <BookOpenCheck size={18} /> Sesión cerrada
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {!loading && sessions.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Participación activa</p>
                    <p className="text-xl font-black text-slate-900">
                      {stats.active} tutoría{stats.active === 1 ? "" : "s"} en curso
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/dashboard/solicitudes"
                className="group flex items-center justify-between rounded-3xl bg-slate-900 p-6 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-400">Encuentra tu próxima sesión</p>
                  <p className="mt-1 text-xl font-black">Explorar solicitudes abiertas</p>
                </div>
                <ArrowRight className="transition group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </section>
      </main>

      {selectedSession && (
        <ReviewModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={(successMessage) => {
            setMessage(successMessage)
            setMessageType("success")
          }}
        />
      )}
    </>
  )
}

export default Tutoring
