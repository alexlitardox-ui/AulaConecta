import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { Link } from "react-router-dom"
import { getMyTutorRequests } from "../../services/requestService"

const statusOptions = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Abiertas" },
  { value: "with_applications", label: "Con postulaciones" },
  { value: "accepted", label: "Aceptadas" },
  { value: "closed", label: "Finalizadas" },
]

function formatDate(date) {
  if (!date) return "Fecha por definir"
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  return time?.slice(0, 5) || "--:--"
}

function getStatusStyles(status) {
  const styles = {
    open: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    with_applications: "bg-amber-50 text-amber-700 ring-amber-100",
    accepted: "bg-blue-50 text-blue-700 ring-blue-100",
    cancelled: "bg-red-50 text-red-700 ring-red-100",
    closed: "bg-slate-100 text-slate-700 ring-slate-200",
  }
  return styles[status] || styles.closed
}

function getStatusLabel(status) {
  const labels = {
    open: "Abierta",
    with_applications: "Con postulaciones",
    accepted: "Aceptada",
    cancelled: "Cancelada",
    closed: "Cerrada",
  }
  return labels[status] || status
}

function MyRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  async function loadMyRequests() {
    setLoading(true)
    setMessage("")
    try {
      const data = await getMyTutorRequests()
      setRequests(data)
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron cargar tus solicitudes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyRequests()
  }, [])

  const filteredRequests = useMemo(() => {
    const text = searchTerm.trim().toLowerCase()
    return requests.filter((request) => {
      const matchesText =
        !text ||
        request.title?.toLowerCase().includes(text) ||
        request.topic?.toLowerCase().includes(text) ||
        request.subject?.name?.toLowerCase().includes(text)
      const matchesStatus =
        statusFilter === "all" ||
        request.status === statusFilter ||
        (statusFilter === "closed" && request.status === "cancelled")
      return matchesText && matchesStatus
    })
  }, [requests, searchTerm, statusFilter])

  const pendingApplications = requests.reduce(
    (total, request) =>
      total +
      (request.applications?.filter((application) => application.status === "pending")
        .length ?? 0),
    0,
  )

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Gestión académica
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Mis solicitudes
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Revisa el estado de tus publicaciones y las postulaciones recibidas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadMyRequests}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
            <Link
              to="/dashboard/solicitudes/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus size={19} />
              Nueva solicitud
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard value={requests.length} label="Solicitudes publicadas" />
          <StatCard value={pendingApplications} label="Postulaciones pendientes" />
          <StatCard
            value={requests.filter((request) => request.status === "accepted").length}
            label="Solicitudes aceptadas"
          />
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar una solicitud..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    statusFilter === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-slate-600">Cargando tus solicitudes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileText size={36} className="mx-auto text-blue-600" />
            <h2 className="mt-4 text-xl font-extrabold text-slate-900">
              No hay solicitudes para mostrar
            </h2>
            <p className="mt-3 text-slate-500">
              Cambia los filtros o publica una nueva solicitud.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {filteredRequests.map((request) => {
              const applicationsCount =
                request.applications?.filter(
                  (application) => application.status === "pending",
                ).length ?? 0

              return (
                <article
                  key={request.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {request.subject?.name || "Materia"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusStyles(
                            request.status,
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                        {request.title}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Tema: {request.topic}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                          <CalendarDays size={17} className="text-blue-600" />
                          {formatDate(request.requested_date)}
                        </span>
                        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                          <Clock size={17} className="text-blue-600" />
                          {formatTime(request.start_time)} - {formatTime(request.end_time)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
                      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 px-6 py-4 text-center ring-1 ring-inset ring-blue-100">
                        <p className="text-2xl font-black text-blue-700">{applicationsCount}</p>
                        <p className="text-xs font-semibold text-slate-500">Pendientes</p>
                      </div>
                      <Link
                        to={`/dashboard/solicitudes/${request.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                      >
                        <Eye size={18} />
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  )
}

export default MyRequests
