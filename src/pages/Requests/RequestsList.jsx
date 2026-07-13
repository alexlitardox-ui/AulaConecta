import { useEffect, useMemo, useState } from "react"
import {
  BookOpenCheck,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"
import ApplicationModal from "../../components/Requests/ApplicationModal"
import RequestCard from "../../components/Requests/RequestCard"
import { getTutorRequests } from "../../services/requestService"

const filters = [
  { value: "all", label: "Todas" },
  { value: "virtual", label: "Virtuales" },
  { value: "presential", label: "Presenciales" },
]

function RequestsList() {
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function loadRequests() {
    setLoading(true)
    setMessage("")

    try {
      const data = await getTutorRequests()
      setRequests(data)
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron cargar las solicitudes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  function handleApplicationSuccess(text) {
    setSuccessMessage(text)
    loadRequests()

    window.setTimeout(() => {
      setSuccessMessage("")
    }, 4000)
  }

  const filteredRequests = useMemo(() => {
    const searchText = searchTerm.trim().toLowerCase()

    return requests.filter((request) => {
      const matchesSearch =
        !searchText ||
        request.title?.toLowerCase().includes(searchText) ||
        request.topic?.toLowerCase().includes(searchText) ||
        request.subject?.name?.toLowerCase().includes(searchText)

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "virtual" && request.modality === "virtual") ||
        (activeFilter === "presential" && request.modality !== "virtual")

      return matchesSearch && matchesFilter
    })
  }, [activeFilter, requests, searchTerm])

  const availableCount = requests.filter(
    (request) => !request.isOwnRequest,
  ).length
  const ownCount = requests.filter((request) => request.isOwnRequest).length

  return (
    <>
      <main className="px-5 py-8 sm:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-8 text-white shadow-2xl shadow-blue-200/50 sm:px-9 lg:px-10">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
                  <Sparkles size={14} />
                  Comunidad académica
                </span>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Encuentra una solicitud y comparte lo que sabes
                </h1>
                <p className="mt-3 max-w-xl leading-7 text-blue-100/90">
                  Explora necesidades reales de otros estudiantes y postúlate como tutor en pocos pasos.
                </p>
              </div>

              <Link
                to="/dashboard/solicitudes/nueva"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-extrabold text-blue-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <Plus size={19} />
                Crear solicitud
              </Link>
            </div>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
              <SummaryCard icon={BookOpenCheck} value={requests.length} label="Solicitudes visibles" />
              <SummaryCard icon={Users} value={availableCount} label="Puedes postularte" />
              <SummaryCard icon={Sparkles} value={ownCount} label="Publicadas por ti" />
            </div>
          </div>

          {successMessage && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por título, tema o materia..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                      activeFilter === filter.value
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={loadRequests}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Filter size={16} />
              Mostrando {filteredRequests.length} de {requests.length} solicitudes
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              {message}
            </div>
          )}

          {loading ? (
            <LoadingState text="Cargando solicitudes..." />
          ) : filteredRequests.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center">
              <Search size={34} className="mx-auto text-blue-600" />
              <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                No encontramos coincidencias
              </h2>
              <p className="mt-3 text-slate-500">
                Prueba otro término, cambia el filtro o publica una solicitud nueva.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApply={setSelectedRequest}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedRequest && (
        <ApplicationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </>
  )
}

function SummaryCard({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-cyan-200">
        <Icon size={21} />
      </span>
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs font-semibold text-blue-100/80">{label}</p>
      </div>
    </div>
  )
}

function LoadingState({ text }) {
  return (
    <div className="mt-12 text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      <p className="mt-4 font-medium text-slate-600">{text}</p>
    </div>
  )
}

export default RequestsList
