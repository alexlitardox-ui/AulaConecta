import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock3, Download, FileText, Plus, RefreshCw, Search, XCircle } from "lucide-react"
import { Link } from "react-router-dom"
import MaterialCard from "../../components/Materials/MaterialCard"
import { deleteMaterial, getMaterialDownloadUrl, getMyMaterials } from "../../services/materialService"

function MyMaterials() {
  const [materials, setMaterials] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  async function loadMyMaterials() {
    setLoading(true); setMessage("")
    try { setMaterials(await getMyMaterials()) }
    catch (error) { console.error(error); setMessage("No se pudieron cargar tus materiales."); setMessageType("error") }
    finally { setLoading(false) }
  }
  useEffect(() => { loadMyMaterials() }, [])

  async function handleDownload(material) {
    setDownloadingId(material.id)
    try { window.location.assign(await getMaterialDownloadUrl(material.file_path)) }
    catch (error) { console.error(error); setMessage("No se pudo descargar el archivo."); setMessageType("error") }
    finally { setDownloadingId(null) }
  }

  async function handleDelete(material) {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este material?")) return
    setDeletingId(material.id); setMessage("")
    try { await deleteMaterial(material); setMaterials(current => current.filter(item => item.id !== material.id)); setMessage("Material eliminado correctamente."); setMessageType("success") }
    catch (error) { console.error(error); setMessage(error.message || "No se pudo eliminar el material."); setMessageType("error") }
    finally { setDeletingId(null) }
  }

  const stats = {
    total: materials.length,
    approved: materials.filter(item => item.review_status === "approved").length,
    pending: materials.filter(item => !item.review_status || item.review_status === "pending").length,
    rejected: materials.filter(item => item.review_status === "rejected").length,
    downloads: materials.reduce((sum, item) => sum + (item.download_count || 0), 0),
  }

  const filteredMaterials = useMemo(() => materials.filter(material => {
    const text = searchTerm.trim().toLowerCase()
    const matchesText = !text || [material.title, material.description, material.subject?.name].filter(Boolean).join(" ").toLowerCase().includes(text)
    const status = material.review_status || "pending"
    return matchesText && (statusFilter === "all" || status === statusFilter)
  }), [materials, searchTerm, statusFilter])

  return (
    <main className="px-5 py-8 sm:px-8"><section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Biblioteca académica</p><h1 className="mt-2 text-3xl font-black text-slate-900">Mis materiales</h1><p className="mt-2 text-slate-600">Administra y consulta el rendimiento de los recursos que compartiste.</p></div><div className="flex flex-col gap-3 sm:flex-row"><button onClick={loadMyMaterials} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={18}/>Actualizar</button><Link to="/dashboard/materiales/nuevo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"><Plus size={19}/>Compartir material</Link></div></div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[[FileText, stats.total, "Publicados", "bg-blue-50 text-blue-600"],[CheckCircle2, stats.approved, "Aprobados", "bg-emerald-50 text-emerald-600"],[Clock3, stats.pending, "En revisión", "bg-amber-50 text-amber-600"],[XCircle, stats.rejected, "Rechazados", "bg-red-50 text-red-600"],[Download, stats.downloads, "Descargas", "bg-indigo-50 text-indigo-600"]].map(([Icon,value,label,classes]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-xl p-3 ${classes}`}><Icon size={21}/></div><p className="mt-4 text-2xl font-black text-slate-900">{value}</p><p className="text-sm text-slate-500">{label}</p></div>)}
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_240px]"><div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input type="search" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Buscar entre tus materiales..." className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/></div><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"><option value="all">Todos los estados</option><option value="approved">Aprobados</option><option value="pending">En revisión</option><option value="rejected">Rechazados</option></select></div>

      {message && <div className={`mt-6 rounded-xl border px-4 py-3 ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}

      {loading ? <div className="mt-10 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"/><p className="mt-4 text-slate-600">Cargando tus materiales...</p></div>
      : filteredMaterials.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-bold text-slate-900">No hay materiales para mostrar</h2><p className="mt-3 text-slate-500">Cambia los filtros o publica un nuevo recurso.</p></div>
      : <div className="mt-8 grid gap-6 xl:grid-cols-2">{filteredMaterials.map(material => <MaterialCard key={material.id} material={material} onDownload={handleDownload} onDelete={handleDelete} downloading={downloadingId===material.id} deleting={deletingId===material.id} showDelete />)}</div>}
    </section></main>
  )
}
export default MyMaterials
