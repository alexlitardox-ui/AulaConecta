import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MessageCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Trophy,
} from "lucide-react"
import { Link, useOutletContext } from "react-router-dom"

import { getDashboardStats } from "../../services/dashboardService"
import { getLevelInfo, getMyGamification } from "../../services/gamificationService"

const notificationIcons = {
  welcome: Sparkles,
  application: BookOpen,
  tutoring: GraduationCap,
  group: Users,
  material: BookOpen,
  system: Bell,
}

const quickActions = [
  {
    title: "Nueva solicitud",
    description: "Pide ayuda académica a la comunidad.",
    path: "/dashboard/solicitudes/nueva",
    icon: Plus,
    iconClass: "bg-blue-100 text-blue-700",
  },
  {
    title: "Explorar solicitudes",
    description: "Encuentra estudiantes que necesitan apoyo.",
    path: "/dashboard/solicitudes",
    icon: BookOpen,
    iconClass: "bg-violet-100 text-violet-700",
  },
  {
    title: "Crear grupo",
    description: "Organiza una comunidad de estudio.",
    path: "/dashboard/grupos/nuevo",
    icon: Users,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Compartir material",
    description: "Publica apuntes y recursos útiles.",
    path: "/dashboard/materiales/nuevo",
    icon: GraduationCap,
    iconClass: "bg-amber-100 text-amber-700",
  },
]

function formatDate(date) {
  if (!date) return ""

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function Dashboard() {
  const { firstName } = useOutletContext()

  const [stats, setStats] = useState({
    requests: 0,
    tutoring: 0,
    groups: 0,
    notifications: [],
    rating: 5,
  })
  const [gamification, setGamification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function loadDashboard() {
    setLoading(true)
    setMessage("")

    try {
      const [data, gameData] = await Promise.all([
        getDashboardStats(),
        getMyGamification().catch(() => null),
      ])
      setStats(data)
      setGamification(gameData)
    } catch (error) {
      console.error(error)
      setMessage("No se pudo cargar la información del Dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const statCards = [
    {
      title: "Solicitudes",
      value: stats.requests,
      description: "Publicadas por ti",
      icon: BookOpen,
      path: "/dashboard/solicitudes/mias",
      accent: "from-blue-500 to-cyan-500",
      soft: "bg-blue-50 text-blue-700",
    },
    {
      title: "Tutorías",
      value: stats.tutoring,
      description: "Sesiones registradas",
      icon: GraduationCap,
      path: "/dashboard/tutorias",
      accent: "from-violet-500 to-fuchsia-500",
      soft: "bg-violet-50 text-violet-700",
    },
    {
      title: "Grupos",
      value: stats.groups,
      description: "Comunidades activas",
      icon: Users,
      path: "/dashboard/grupos/mios",
      accent: "from-emerald-500 to-teal-500",
      soft: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Reputación",
      value: Number(stats.rating ?? 5).toFixed(1),
      description: "Promedio de valoración",
      icon: Star,
      path: "/dashboard/reputacion",
      accent: "from-amber-400 to-orange-500",
      soft: "bg-amber-50 text-amber-700",
    },
  ]

  const levelInfo = useMemo(
    () => getLevelInfo(gamification?.xp ?? 0),
    [gamification],
  )

  const unreadCount = stats.notifications.filter(
    (notification) => !notification.is_read,
  ).length

  return (
    <main className="px-4 py-6 sm:px-7 sm:py-8 xl:px-9">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-300/50 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.05)_50%,transparent_65%)]" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100 backdrop-blur">
                <Sparkles size={15} />
                Tu centro académico
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Hola, {firstName} 👋
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Organiza tus actividades, encuentra apoyo y mantente conectado
                con toda la comunidad de AulaConecta.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/dashboard/solicitudes/nueva"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <Plus size={18} />
                  Crear solicitud
                </Link>

                <Link
                  to="/dashboard/solicitudes"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Explorar comunidad
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Tu nivel en AulaConecta
                  </p>
                  <p className="mt-2 text-2xl font-black">{levelInfo.current.icon} {levelInfo.current.name}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 transition-all duration-700"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Tienes <strong>{gamification?.xp ?? 0} XP</strong>. {levelInfo.next
                  ? `Te faltan ${levelInfo.remaining} XP para ${levelInfo.next.name}.`
                  : "Alcanzaste el nivel máximo."}
              </p>
              <Link
                to="/dashboard/logros"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-200 transition hover:text-white"
              >
                <Trophy size={16} />
                Ver logros y ranking
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-white"
                />
              ))
            : statCards.map((card) => {
                const Icon = card.icon

                return (
                  <Link
                    key={card.title}
                    to={card.path}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60"
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`}
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div className={`rounded-2xl p-3 ${card.soft}`}>
                        <Icon size={22} />
                      </div>

                      <ArrowRight
                        size={18}
                        className="-translate-x-1 text-slate-300 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                      />
                    </div>

                    <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                      {card.value}
                    </p>
                    <h2 className="mt-1 font-bold text-slate-800">
                      {card.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {card.description}
                    </p>
                  </Link>
                )
              })}
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell size={19} className="text-blue-600" />
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
                      Actividad reciente
                    </p>
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Últimas notificaciones
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {unreadCount > 0
                      ? `Tienes ${unreadCount} novedad${unreadCount === 1 ? "" : "es"} sin leer.`
                      : "Estás al día con todas tus novedades."}
                  </p>
                </div>

                <Link
                  to="/dashboard/notificaciones"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
                >
                  Ver todas
                  <ArrowRight size={16} />
                </Link>
              </div>

              {loading ? (
                <div className="mt-7 space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : stats.notifications.length === 0 ? (
                <div className="mt-7 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <CheckCircle2 size={27} />
                  </div>
                  <h3 className="mt-4 font-black text-slate-900">
                    Todo tranquilo por aquí
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Las postulaciones, tutorías, mensajes y novedades de tu
                    cuenta aparecerán en esta sección.
                  </p>
                </div>
              ) : (
                <div className="mt-7 space-y-3">
                  {stats.notifications.map((notification) => {
                    const Icon =
                      notificationIcons[notification.notification_type] || Bell

                    return (
                      <Link
                        key={notification.id}
                        to={
                          notification.action_url ||
                          "/dashboard/notificaciones"
                        }
                        className="group flex items-start gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-blue-100 hover:bg-blue-50/50"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            notification.is_read
                              ? "bg-slate-100 text-slate-500"
                              : "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          }`}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="truncate font-bold text-slate-900">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-xs font-medium text-slate-400">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </article>
          </div>

          <aside className="space-y-6">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Acciones rápidas
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Todo lo importante a un clic.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-600">
                  <Sparkles size={20} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon

                  return (
                    <Link
                      key={action.path}
                      to={action.path}
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.iconClass}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900">
                          {action.title}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600"
                      />
                    </Link>
                  )
                })}
              </div>
            </article>

            <article className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/70">
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
              <CalendarDays size={28} className="relative text-blue-100" />
              <h2 className="relative mt-4 text-xl font-black">
                Organiza tus tutorías
              </h2>
              <p className="relative mt-2 text-sm leading-6 text-blue-100">
                Consulta tus sesiones y coordina con tus compañeros desde el
                chat de AulaConecta.
              </p>
              <div className="relative mt-5 flex flex-wrap gap-3">
                <Link
                  to="/dashboard/tutorias"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50"
                >
                  <Clock3 size={17} />
                  Ver tutorías
                </Link>
                <Link
                  to="/dashboard/chat"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <MessageCircle size={17} />
                  Abrir chat
                </Link>
              </div>
            </article>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Actualizar información
            </button>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
