import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Filter,
  GraduationCap,
  Info,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
} from "../../services/notificationService"
import { supabase } from "../../services/supabase"

const notificationMeta = {
  welcome: {
    icon: Sparkles,
    label: "Bienvenida",
    iconClass: "bg-violet-100 text-violet-700",
    unreadClass: "border-violet-200 bg-violet-50/70",
  },
  application: {
    icon: BookOpen,
    label: "Solicitudes",
    iconClass: "bg-blue-100 text-blue-700",
    unreadClass: "border-blue-200 bg-blue-50/70",
  },
  tutoring: {
    icon: GraduationCap,
    label: "Tutorías",
    iconClass: "bg-emerald-100 text-emerald-700",
    unreadClass: "border-emerald-200 bg-emerald-50/70",
  },
  group: {
    icon: Users,
    label: "Grupos",
    iconClass: "bg-amber-100 text-amber-700",
    unreadClass: "border-amber-200 bg-amber-50/70",
  },
  material: {
    icon: BookOpen,
    label: "Materiales",
    iconClass: "bg-cyan-100 text-cyan-700",
    unreadClass: "border-cyan-200 bg-cyan-50/70",
  },
  message: {
    icon: MessageCircle,
    label: "Mensajes",
    iconClass: "bg-indigo-100 text-indigo-700",
    unreadClass: "border-indigo-200 bg-indigo-50/70",
  },
  system: {
    icon: Info,
    label: "Sistema",
    iconClass: "bg-slate-100 text-slate-700",
    unreadClass: "border-slate-300 bg-slate-50",
  },
}

function getMeta(type) {
  return (
    notificationMeta[type] ?? {
      icon: Bell,
      label: "Actividad",
      iconClass: "bg-slate-100 text-slate-700",
      unreadClass: "border-blue-200 bg-blue-50/60",
    }
  )
}

function formatFullDate(date) {
  if (!date) return ""

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function formatRelativeTime(date) {
  if (!date) return ""

  const now = new Date()
  const value = new Date(date)
  const seconds = Math.max(0, Math.floor((now - value) / 1000))

  if (seconds < 60) return "Hace unos segundos"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} día${days === 1 ? "" : "s"}`

  return formatFullDate(date)
}

function getDateGroup(date) {
  const value = new Date(date)
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startValue = new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const difference = Math.round((startToday - startValue) / 86400000)

  if (difference === 0) return "Hoy"
  if (difference === 1) return "Ayer"
  if (difference < 7) return "Esta semana"
  return "Anteriores"
}

function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [readFilter, setReadFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  async function loadNotifications({ silent = false } = {}) {
    if (silent) setRefreshing(true)
    else setLoading(true)

    setMessage("")

    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron cargar las notificaciones.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let unsubscribe = () => {}
    let mounted = true

    async function initializeNotifications() {
      await loadNotifications()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted || !user) return

      unsubscribe = subscribeToNotifications(user.id, () => {
        loadNotifications({ silent: true })
      })
    }

    initializeNotifications()

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  async function handleOpen(notification) {
    setProcessingId(notification.id)
    setMessage("")

    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id)

        setNotifications((currentNotifications) =>
          currentNotifications.map((currentNotification) =>
            currentNotification.id === notification.id
              ? { ...currentNotification, is_read: true }
              : currentNotification,
          ),
        )
      }

      if (notification.action_url) navigate(notification.action_url)
    } catch (error) {
      console.error(error)
      setMessage("No se pudo abrir la notificación.")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleMarkOne(notification) {
    if (notification.is_read) return

    setProcessingId(notification.id)
    setMessage("")

    try {
      await markNotificationAsRead(notification.id)
      setNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.id === notification.id
            ? { ...currentNotification, is_read: true }
            : currentNotification,
        ),
      )
    } catch (error) {
      console.error(error)
      setMessage("No se pudo marcar la notificación como leída.")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true)
    setMessage("")

    try {
      await markAllNotificationsAsRead()
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      )
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron marcar todas como leídas.")
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleDelete(notificationId) {
    setProcessingId(notificationId)
    setMessage("")

    try {
      await deleteNotification(notificationId)
      setNotifications((currentNotifications) =>
        currentNotifications.filter(
          (notification) => notification.id !== notificationId,
        ),
      )
    } catch (error) {
      console.error(error)
      setMessage("No se pudo eliminar la notificación.")
    } finally {
      setProcessingId(null)
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length
  const readCount = notifications.length - unreadCount
  const todayCount = notifications.filter(
    (notification) => getDateGroup(notification.created_at) === "Hoy",
  ).length

  const availableTypes = useMemo(
    () =>
      [...new Set(notifications.map((item) => item.notification_type))].filter(
        Boolean,
      ),
    [notifications],
  )

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return notifications.filter((notification) => {
      const matchesSearch =
        !normalizedSearch ||
        `${notification.title ?? ""} ${notification.message ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesRead =
        readFilter === "all" ||
        (readFilter === "unread" && !notification.is_read) ||
        (readFilter === "read" && notification.is_read)

      const matchesType =
        typeFilter === "all" || notification.notification_type === typeFilter

      return matchesSearch && matchesRead && matchesType
    })
  }, [notifications, readFilter, searchTerm, typeFilter])

  const groupedNotifications = useMemo(() => {
    const groups = ["Hoy", "Ayer", "Esta semana", "Anteriores"]

    return groups
      .map((label) => ({
        label,
        items: filteredNotifications.filter(
          (notification) => getDateGroup(notification.created_at) === label,
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [filteredNotifications])

  const hasActiveFilters =
    searchTerm.trim() || readFilter !== "all" || typeFilter !== "all"

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
                <Bell size={15} />
                Centro de actividad
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                Tus notificaciones
              </h1>

              <p className="mt-3 max-w-xl leading-7 text-blue-100/85">
                Revisa solicitudes, tutorías, mensajes y novedades importantes de
                AulaConecta desde un solo lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadNotifications({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                Actualizar
              </button>

              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markingAll || unreadCount === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markingAll ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <CheckCheck size={18} />
                )}
                Marcar todo como leído
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total",
              value: notifications.length,
              helper: "Actividad acumulada",
              icon: Bell,
            },
            {
              label: "Sin leer",
              value: unreadCount,
              helper: unreadCount ? "Requieren tu atención" : "Todo al día",
              icon: Clock3,
            },
            {
              label: "Leídas",
              value: readCount,
              helper: "Ya revisadas",
              icon: CheckCheck,
            },
            {
              label: "Hoy",
              value: todayCount,
              helper: "Recibidas recientemente",
              icon: Sparkles,
            },
          ].map(({ label, value, helper, icon: Icon }) => (
            <article
              key={label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{helper}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon size={20} />
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar en tus notificaciones..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="relative">
              <Filter
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={readFilter}
                onChange={(event) => setReadFilter(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 lg:w-44"
              >
                <option value="all">Todas</option>
                <option value="unread">Sin leer</option>
                <option value="read">Leídas</option>
              </select>
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 lg:w-48"
            >
              <option value="all">Todos los tipos</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {getMeta(type).label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <LoaderCircle size={38} className="mx-auto animate-spin text-blue-600" />
            <p className="mt-4 font-medium text-slate-600">
              Cargando notificaciones...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Bell size={38} className="mx-auto text-blue-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Aún no tienes notificaciones
            </h2>
            <p className="mx-auto mt-3 max-w-md text-slate-500">
              Las novedades relacionadas con tus solicitudes, tutorías, grupos y
              materiales aparecerán aquí.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Search size={34} className="mx-auto text-slate-400" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No encontramos resultados
            </h2>
            <p className="mt-2 text-slate-500">
              Prueba con otro texto o cambia los filtros aplicados.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setReadFilter("all")
                  setTypeFilter("all")
                }}
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {groupedNotifications.map((group) => (
              <section key={group.label}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500">
                    {group.label}
                  </h2>
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                    {group.items.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((notification) => {
                    const meta = getMeta(notification.notification_type)
                    const Icon = meta.icon
                    const isProcessing = processingId === notification.id

                    return (
                      <article
                        key={notification.id}
                        className={`group rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                          notification.is_read
                            ? "border-slate-200 bg-white"
                            : meta.unreadClass
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.iconClass}`}
                          >
                            <Icon size={22} />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpen(notification)}
                            disabled={isProcessing}
                            className="min-w-0 flex-1 text-left disabled:opacity-60"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200/80">
                                {meta.label}
                              </span>
                              {!notification.is_read && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[11px] font-bold text-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                  Nueva
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-black text-slate-950 sm:text-lg">
                                  {notification.title}
                                </h3>
                                <p className="mt-1.5 line-clamp-3 leading-6 text-slate-600">
                                  {notification.message}
                                </p>
                              </div>

                              {notification.action_url && (
                                <ChevronRight
                                  size={21}
                                  className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                                />
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span className="font-semibold text-slate-500">
                                {formatRelativeTime(notification.created_at)}
                              </span>
                              <span aria-hidden="true">•</span>
                              <span>{formatFullDate(notification.created_at)}</span>
                              {notification.action_url && (
                                <>
                                  <span aria-hidden="true">•</span>
                                  <span className="font-semibold text-blue-600">
                                    Abrir detalle
                                  </span>
                                </>
                              )}
                            </div>
                          </button>

                          <div className="flex shrink-0 flex-col gap-1">
                            {!notification.is_read && (
                              <button
                                type="button"
                                aria-label="Marcar como leída"
                                title="Marcar como leída"
                                onClick={() => handleMarkOne(notification)}
                                disabled={isProcessing}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                              >
                                <Check size={18} />
                              </button>
                            )}

                            <button
                              type="button"
                              aria-label="Eliminar notificación"
                              title="Eliminar notificación"
                              onClick={() => handleDelete(notification.id)}
                              disabled={isProcessing}
                              className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <LoaderCircle size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Notifications
