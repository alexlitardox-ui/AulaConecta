import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock3, Download, FileText, Plus, RefreshCw, Search, XCircle } from "lucide-react"
import MaterialCard from "../../components/Materials/MaterialCard"
import ModuleTabs from "../../components/Navigation/ModuleTabs"
import { materialTabs } from "../../components/Navigation/moduleTabsConfig"
import { Button, EmptyState, FeedbackAlert, LoadingState, MetricCard, PageHeader } from "../../components/UI"
import { deleteMaterial, getMaterialDownloadUrl, getMyMaterials } from "../../services/materialService"

function MyMaterials() {
  const [materials, setMaterials] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info")

  async function loadMyMaterials() {
    setLoading(true)
    setMessage("")
    try {
      setMaterials(await getMyMaterials())
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron cargar tus materiales.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMyMaterials() }, [])

  async function handleDownload(material) {
    setDownloadingId(material.id)
    try {
      window.location.assign(await getMaterialDownloadUrl(material.file_path, material.id))
    } catch (error) {
      console.error(error)
      setMessage("No se pudo descargar el archivo.")
      setMessageType("error")
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(material) {
    if (!window.confirm(`¿Eliminar definitivamente “${material.title}”? Esta acción no se puede deshacer.`)) return
    setDeletingId(material.id)
    setMessage("")
    try {
      await deleteMaterial(material)
      setMaterials((current) => current.filter((item) => item.id !== material.id))
      setMessage("Material eliminado correctamente.")
      setMessageType("success")
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo eliminar el material.")
      setMessageType("error")
    } finally {
      setDeletingId(null)
    }
  }

  const stats = {
    total: materials.length,
    approved: materials.filter((item) => item.review_status === "approved").length,
    pending: materials.filter((item) => !item.review_status || item.review_status === "pending").length,
    rejected: materials.filter((item) => item.review_status === "rejected").length,
    downloads: materials.reduce((sum, item) => sum + (item.download_count || 0), 0),
  }

  const filteredMaterials = useMemo(() => materials.filter((material) => {
    const text = searchTerm.trim().toLowerCase()
    const matchesText = !text || [material.title, material.description, material.subject?.name]
      .filter(Boolean).join(" ").toLowerCase().includes(text)
    const status = material.review_status || "pending"
    return matchesText && (statusFilter === "all" || status === statusFilter)
  }), [materials, searchTerm, statusFilter])

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <ModuleTabs label="Navegación de materiales" items={materialTabs} />
        <PageHeader
          eyebrow="Biblioteca académica"
          title="Mis materiales"
          description="Administra y consulta el rendimiento de los recursos que compartiste."
          actions={
            <>
              <Button variant="secondary" onClick={loadMyMaterials} disabled={loading}>
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Actualizar
              </Button>
              <Button as="link" to="/dashboard/materiales/nuevo">
                <Plus size={19} />
                Compartir material
              </Button>
            </>
          }
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={FileText} value={stats.total} label="Publicados" />
          <MetricCard icon={CheckCircle2} value={stats.approved} label="Aprobados" tone="emerald" />
          <MetricCard icon={Clock3} value={stats.pending} label="En revisión" tone="amber" />
          <MetricCard icon={XCircle} value={stats.rejected} label="Rechazados" tone="red" />
          <MetricCard icon={Download} value={stats.downloads} label="Descargas" tone="indigo" />
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar entre tus materiales..." className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
            <option value="all">Todos los estados</option>
            <option value="approved">Aprobados</option>
            <option value="pending">En revisión</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        {message ? <FeedbackAlert type={messageType} className="mt-6">{message}</FeedbackAlert> : null}

        {loading ? (
          <LoadingState label="Cargando tus materiales..." />
        ) : filteredMaterials.length === 0 ? (
          <EmptyState icon={FileText} title="No hay materiales para mostrar" description="Cambia los filtros o publica tu primer recurso académico." actionLabel="Compartir material" actionTo="/dashboard/materiales/nuevo" />
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {filteredMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} onDownload={handleDownload} onDelete={handleDelete} downloading={downloadingId === material.id} deleting={deletingId === material.id} showDelete />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default MyMaterials
