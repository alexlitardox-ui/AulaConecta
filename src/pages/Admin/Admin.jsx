import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  AlertCircle,
  Ban,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  Flag,
  GraduationCap,
  HardDrive,
  HeartPulse,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react"
import SecurityPanel from "../../components/Admin/SecurityPanel"
import {
  cancelAdminSession,
  deleteAdminGroup,
  deleteAdminMaterial,
  deleteAdminRequest,
  getAdminAccess,
  getAdminDashboard,
  resolveReport,
  reviewMaterial,
  setUserRole,
  setUserStatus,
} from "../../services/adminService"

const tabs = [
  ["materials", "Materiales"],
  ["requests", "Solicitudes"],
  ["groups", "Grupos"],
  ["sessions", "Tutorías"],
  ["users", "Usuarios"],
  ["reports", "Reportes"],
  ["audit", "Auditoría"],
  ["security", "Ciberseguridad"],
]

const PAGE_SIZE = 8
const statusClass =
  "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <Icon size={22} />
        </span>
      </div>
    </div>
  )
}


function HealthCard({ icon: Icon, label, item }) {
  const operational = item?.status === "operational"

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          operational
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        }`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <b className="text-sm text-slate-900 dark:text-white">{label}</b>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              operational ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {item?.detail ?? "Estado no disponible"}
        </p>
      </div>
    </div>
  )
}

function activityLabel(item) {
  const labels = {
    user_suspended: "Suspendió una cuenta",
    user_reactivated: "Reactivó una cuenta",
    role_changed: "Cambió un rol",
    material_deleted: "Eliminó un material",
    request_deleted: "Eliminó una solicitud",
    group_deleted: "Eliminó un grupo",
    tutoring_cancelled: "Canceló una tutoría",
    report_resolved: "Resolvió un reporte",
    report_dismissed: "Descartó un reporte",
  }

  return labels[item?.action] ?? item?.action?.replaceAll("_", " ") ?? "Acción administrativa"
}

function PersonName({ person }) {
  if (!person) return "Usuario no disponible"
  return (
    `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "Usuario"
  )
}

function accountStatus(item) {
  return item.account_status ?? "active"
}

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("materials")
  const [workingId, setWorkingId] = useState(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  async function load() {
    setLoading(true)
    setError("")

    try {
      const access = await getAdminAccess()
      setAllowed(access.allowed)
      if (access.allowed) setData(await getAdminDashboard())
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el panel.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [tab, search, roleFilter, statusFilter])

  const list = useMemo(() => {
    const values =
      tab === "audit"
        ? data?.auditLogs
        : tab === "security"
          ? []
          : data?.[tab]
    const q = search.trim().toLowerCase()

    return (values ?? []).filter((item) => {
      const matchesSearch =
        !q || JSON.stringify(item).toLowerCase().includes(q)

      if (tab !== "users") return matchesSearch

      const itemRole = item.role ?? (item.is_admin ? "admin" : "student")
      const matchesRole = roleFilter === "all" || itemRole === roleFilter
      const matchesStatus =
        statusFilter === "all" || accountStatus(item) === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [data, roleFilter, search, statusFilter, tab])

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const paginatedList =
    tab === "users"
      ? list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : list

  async function runAction(id, action, success) {
    setWorkingId(id)
    setError("")
    setMessage("")

    try {
      await action()
      setMessage(success)
      await load()
    } catch (actionError) {
      setError(actionError.message || "No se pudo completar la acción.")
    } finally {
      setWorkingId(null)
    }
  }

  function askReason(label, defaultReason = "Administración del sistema") {
    return (
      window.prompt(`Motivo para ${label}:`, defaultReason)?.trim() ||
      defaultReason
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={34} />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto text-red-600" size={38} />
        <h1 className="mt-4 text-xl font-bold">
          No se pudo abrir Administración
        </h1>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={load}
          className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldCheck className="mx-auto text-amber-600" size={42} />
        <h1 className="mt-4 text-2xl font-black">Acceso restringido</h1>
        <p className="mt-2">Tu cuenta no tiene permisos administrativos.</p>
      </div>
    )
  }

  const { stats, role } = data

  return (
    <div className="space-y-7 pb-10">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-7 text-white shadow-xl md:p-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={15} /> {role}
            </span>
            <h1 className="mt-5 text-3xl font-black md:text-4xl">
              Control general de AulaConecta
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-blue-100 md:text-base">
              Gestiona usuarios, publicaciones, reportes y acciones
              administrativas con trazabilidad.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-900"
          >
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>
      </section>

      {(message || error) && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
          {error || message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="Usuarios"
          value={stats.users}
          detail="Perfiles registrados"
        />
        <StatCard
          icon={UserCheck}
          label="Activos"
          value={stats.activeUsers ?? stats.users}
          detail="Cuentas habilitadas"
        />
        <StatCard
          icon={Ban}
          label="Suspendidos"
          value={stats.suspendedUsers ?? 0}
          detail="Acceso bloqueado"
        />
        <StatCard
          icon={BookOpen}
          label="Solicitudes"
          value={stats.requests}
          detail="Publicaciones académicas"
        />
        <StatCard
          icon={GraduationCap}
          label="Tutorías"
          value={stats.sessions}
          detail="Sesiones registradas"
        />
        <StatCard
          icon={Users}
          label="Grupos"
          value={stats.groups}
          detail="Comunidades creadas"
        />
        <StatCard
          icon={FileText}
          label="Materiales"
          value={stats.materials}
          detail="Archivos registrados"
        />
        <StatCard
          icon={Clock3}
          label="Por revisar"
          value={stats.pendingMaterials}
          detail="Moderación pendiente"
        />
        <StatCard
          icon={Flag}
          label="Reportes"
          value={stats.pendingReports ?? 0}
          detail="Casos pendientes"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                Supervisión
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                Estado del sistema
              </h2>
            </div>
            <HeartPulse className="text-blue-600" size={25} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <HealthCard icon={ShieldCheck} label="Autenticación" item={data.health?.authentication} />
            <HealthCard icon={Database} label="Base de datos" item={data.health?.database} />
            <HealthCard icon={HardDrive} label="Materiales y Storage" item={data.health?.storage} />
            <HealthCard icon={Flag} label="Moderación" item={data.health?.moderation} />
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Última comprobación: {new Date(data.checkedAt).toLocaleString("es-EC")}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                Trazabilidad
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                Actividad reciente
              </h2>
            </div>
            <Activity className="text-indigo-600" size={24} />
          </div>

          <div className="mt-5 space-y-3">
            {(data.auditLogs ?? []).slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950"
              >
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {activityLabel(item)}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {PersonName({ person: item.actor })} · {item.entity_type ?? "sistema"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleString("es-EC")}
                  </p>
                </div>
              </div>
            ))}

            {!data.auditLogs?.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Todavía no existen acciones administrativas registradas.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  tab === value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab !== "security" && (
            <div className="flex flex-col gap-2 sm:flex-row">
            {tab === "users" && (
              <>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="all">Todos los roles</option>
                  <option value="student">Estudiantes</option>
                  <option value="moderator">Moderadores</option>
                  <option value="admin">Administradores</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="suspended">Suspendidos</option>
                </select>
              </>
            )}

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar en esta sección"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 xl:w-72"
              />
            </div>
            </div>
          )}
        </div>

        {tab === "security" ? (
          <div className="mt-5">
            {role === "admin" ? (
              <SecurityPanel />
            ) : (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
                <ShieldCheck className="mx-auto" size={42} />
                <h2 className="mt-4 text-xl font-black">Solo administradores</h2>
                <p className="mt-2 text-sm">
                  Los moderadores no pueden acceder al diagnóstico interno de ciberseguridad.
                </p>
              </div>
            )}
          </div>
        ) : (
        <div className="mt-5 space-y-3">
          {tab === "materials" &&
            paginatedList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{item.title}</b>
                    <span className={statusClass}>{item.review_status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.subject?.code} · <PersonName person={item.author} />
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.review_status === "pending" && (
                    <>
                      <button
                        disabled={workingId === item.id}
                        onClick={() =>
                          runAction(
                            item.id,
                            () => reviewMaterial(item.id, "approved"),
                            "Material aprobado.",
                          )
                        }
                        className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"
                        title="Aprobar material"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button
                        disabled={workingId === item.id}
                        onClick={() =>
                          runAction(
                            item.id,
                            () => reviewMaterial(item.id, "rejected"),
                            "Material rechazado.",
                          )
                        }
                        className="rounded-xl bg-amber-50 p-2.5 text-amber-700"
                        title="Rechazar material"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                  <button
                    disabled={workingId === item.id}
                    onClick={() => {
                      if (window.confirm("¿Eliminar definitivamente este material?")) {
                        const reason = askReason("eliminar el material", "Dato de prueba")
                        runAction(
                          item.id,
                          () => deleteAdminMaterial(item, reason),
                          "Material eliminado y acción registrada.",
                        )
                      }
                    }}
                    className="rounded-xl bg-red-50 p-2.5 text-red-700"
                    title="Eliminar material"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

          {tab === "requests" &&
            paginatedList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div>
                  <b>{item.title}</b>
                  <p className="text-xs text-slate-500">
                    <PersonName person={item.author} /> · {item.status}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("¿Eliminar esta solicitud y sus datos relacionados?")) {
                      const reason = askReason("eliminar la solicitud", "Dato de prueba")
                      runAction(
                        item.id,
                        () => deleteAdminRequest(item.id, reason),
                        "Solicitud eliminada.",
                      )
                    }
                  }}
                  className="rounded-xl bg-red-50 p-2.5 text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

          {tab === "groups" &&
            paginatedList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div>
                  <b>{item.name}</b>
                  <p className="text-xs text-slate-500">
                    <PersonName person={item.author} /> · {item.status}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("¿Eliminar este grupo y sus membresías?")) {
                      const reason = askReason("eliminar el grupo", "Dato de prueba")
                      runAction(
                        item.id,
                        () => deleteAdminGroup(item.id, reason),
                        "Grupo eliminado.",
                      )
                    }
                  }}
                  className="rounded-xl bg-red-50 p-2.5 text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

          {tab === "sessions" &&
            paginatedList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div>
                  <b>{item.subject?.name ?? "Tutoría"}</b>
                  <p className="text-xs text-slate-500">
                    <PersonName person={item.student} /> / <PersonName person={item.tutor} /> · {item.status}
                  </p>
                </div>
                {!['completed', 'cancelled'].includes(item.status) && (
                  <button
                    onClick={() => {
                      if (window.confirm("¿Cancelar esta tutoría?")) {
                        const reason = askReason("cancelar la tutoría")
                        runAction(
                          item.id,
                          () => cancelAdminSession(item.id, reason),
                          "Tutoría cancelada.",
                        )
                      }
                    }}
                    className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ))}

          {tab === "users" &&
            paginatedList.map((item) => {
              const itemRole = item.role ?? (item.is_admin ? "admin" : "student")
              const itemStatus = accountStatus(item)

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                        <UserCog size={20} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="truncate">
                            {item.first_name} {item.last_name}
                          </b>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                              itemStatus === "suspended"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                            }`}
                          >
                            {itemStatus === "suspended" ? "Suspendido" : "Activo"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Rol: {itemRole} · Registrado {new Date(item.created_at).toLocaleDateString("es-EC")}
                        </p>
                        {item.suspension_reason && (
                          <p className="mt-1 text-xs text-red-600">
                            Motivo: {item.suspension_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/dashboard/usuarios/${item.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <ExternalLink size={16} /> Perfil
                      </Link>

                      {role === "admin" && (
                        <>
                          <select
                            value={itemRole}
                            disabled={workingId === item.id}
                            onChange={(event) =>
                              runAction(
                                item.id,
                                () => setUserRole(item.id, event.target.value),
                                "Rol actualizado.",
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                          >
                            <option value="student">Estudiante</option>
                            <option value="moderator">Moderador</option>
                            <option value="admin">Administrador</option>
                          </select>

                          {itemStatus === "active" ? (
                            <button
                              disabled={workingId === item.id}
                              onClick={() => {
                                const reason = askReason(
                                  "suspender la cuenta",
                                  "Incumplimiento de las normas de la comunidad",
                                )
                                if (
                                  window.confirm(
                                    "¿Suspender esta cuenta? El usuario perderá acceso al sistema.",
                                  )
                                ) {
                                  runAction(
                                    item.id,
                                    () => setUserStatus(item.id, "suspended", reason),
                                    "Cuenta suspendida.",
                                  )
                                }
                              }}
                              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-200"
                            >
                              <Ban size={16} /> Suspender
                            </button>
                          ) : (
                            <button
                              disabled={workingId === item.id}
                              onClick={() =>
                                runAction(
                                  item.id,
                                  () =>
                                    setUserStatus(
                                      item.id,
                                      "active",
                                      "Cuenta reactivada por administración",
                                    ),
                                  "Cuenta reactivada.",
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                            >
                              <UserCheck size={16} /> Reactivar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

          {tab === "reports" &&
            paginatedList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b>
                        {item.entity_type} #{item.entity_id}
                      </b>
                      <span className={statusClass}>{item.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      <PersonName person={item.reporter} /> · {item.reason}
                    </p>
                    {item.details && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {item.details}
                      </p>
                    )}
                  </div>
                  {item.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        disabled={workingId === item.id}
                        onClick={() =>
                          runAction(
                            item.id,
                            () =>
                              resolveReport(
                                item.id,
                                "resolved",
                                askReason("resolver el reporte"),
                              ),
                            "Reporte resuelto.",
                          )
                        }
                        className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
                      >
                        Resolver
                      </button>
                      <button
                        disabled={workingId === item.id}
                        onClick={() =>
                          runAction(
                            item.id,
                            () =>
                              resolveReport(
                                item.id,
                                "dismissed",
                                askReason("descartar el reporte"),
                              ),
                            "Reporte descartado.",
                          )
                        }
                        className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
                      >
                        Descartar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

          {tab === "audit" &&
            paginatedList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <b>{item.action}</b>
                  <span className={statusClass}>{item.entity_type}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  <PersonName person={item.actor} /> · {item.reason || "Sin motivo registrado"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleString("es-EC")}
                </p>
              </div>
            ))}

          {!paginatedList.length && (
            <p className="py-10 text-center text-sm text-slate-500">
              No hay registros para mostrar.
            </p>
          )}
        </div>
        )}

        {tab === "users" && list.length > PAGE_SIZE && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, list.length)} de {list.length} usuarios
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-xl border border-slate-200 p-2 disabled:opacity-40 dark:border-slate-700"
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-2 text-sm font-bold">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-xl border border-slate-200 p-2 disabled:opacity-40 dark:border-slate-700"
                aria-label="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
