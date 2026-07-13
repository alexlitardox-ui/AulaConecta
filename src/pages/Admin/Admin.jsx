import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BookOpen, CheckCircle2, Clock3, FileText, GraduationCap, RefreshCw, Search, ShieldCheck, Users, XCircle } from "lucide-react"
import { getAdminAccess, getAdminDashboard, reviewMaterial } from "../../services/adminService"

const statusStyles = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
}

function StatCard({ icon: Icon, label, value, detail }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><span className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></span></div>
  </div>
}

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [reviewingId, setReviewingId] = useState(null)

  async function load() {
    setLoading(true); setError("")
    try {
      const hasAccess = await getAdminAccess()
      setAllowed(hasAccess)
      if (hasAccess) setData(await getAdminDashboard())
    } catch (err) { setError(err.message || "No se pudo cargar el panel.") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data?.users ?? []
    return (data?.users ?? []).filter((user) => `${user.first_name ?? ""} ${user.last_name ?? ""}`.toLowerCase().includes(q))
  }, [data, search])

  async function handleReview(id, status) {
    setReviewingId(id); setError(""); setMessage("")
    try {
      await reviewMaterial(id, status)
      setData((current) => ({ ...current, materials: current.materials.filter((item) => item.id !== id), stats: { ...current.stats, pendingMaterials: Math.max(0, current.stats.pendingMaterials - 1) } }))
      setMessage(status === "approved" ? "Material aprobado correctamente." : "Material rechazado correctamente.")
    } catch (err) { setError(err.message || "No se pudo actualizar el material.") }
    finally { setReviewingId(null) }
  }

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><RefreshCw className="animate-spin text-blue-600" size={34} /></div>

  if (error && !data) return <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center"><AlertCircle className="mx-auto text-red-600" size={38}/><h1 className="mt-4 text-xl font-bold text-red-900">No se pudo abrir Administración</h1><p className="mt-2 text-sm text-red-700">{error}</p><button onClick={load} className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">Reintentar</button></div>

  if (!allowed) return <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"><ShieldCheck className="mx-auto text-amber-600" size={42}/><h1 className="mt-4 text-2xl font-black text-slate-900">Acceso restringido</h1><p className="mt-2 text-slate-600">Tu cuenta no tiene permisos de administrador.</p></div>

  const { stats, materials } = data
  return <div className="space-y-7 pb-10">
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-7 text-white shadow-xl md:p-9">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest"><ShieldCheck size={15}/> Administración</span><h1 className="mt-5 text-3xl font-black md:text-4xl">Control general de AulaConecta</h1><p className="mt-3 max-w-2xl text-sm text-blue-100 md:text-base">Revisa el crecimiento de la comunidad y modera los materiales académicos pendientes.</p></div><button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-900"><RefreshCw size={18}/> Actualizar</button></div>
    </section>

    {(message || error) && <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>} {error || message}</div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard icon={Users} label="Usuarios" value={stats.users} detail="Perfiles registrados" />
      <StatCard icon={BookOpen} label="Solicitudes" value={stats.requests} detail="Solicitudes publicadas" />
      <StatCard icon={GraduationCap} label="Tutorías" value={stats.sessions} detail="Sesiones creadas" />
      <StatCard icon={Users} label="Grupos" value={stats.groups} detail="Grupos de estudio" />
      <StatCard icon={FileText} label="Materiales" value={stats.materials} detail="Archivos publicados" />
      <StatCard icon={Clock3} label="Por revisar" value={stats.pendingMaterials} detail="Moderación pendiente" />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black text-slate-900">Usuarios recientes</h2><p className="text-sm text-slate-500">Últimos perfiles creados</p></div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar usuario" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"/></div></div>
        <div className="mt-5 space-y-3">{filteredUsers.map((user) => <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"><div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-blue-100 font-bold text-blue-700">{user.avatar_url ? <img src={user.avatar_url} className="h-full w-full object-cover" alt=""/> : `${user.first_name?.[0] ?? "U"}${user.last_name?.[0] ?? ""}`}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{user.first_name} {user.last_name}</p><p className="text-xs text-slate-500">Reputación: {Number(user.rating ?? 0).toFixed(1)}</p></div>{user.is_admin && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">Admin</span>}</div>)}{!filteredUsers.length && <p className="py-8 text-center text-sm text-slate-500">No se encontraron usuarios.</p>}</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><h2 className="text-xl font-black text-slate-900">Moderación de materiales</h2><p className="text-sm text-slate-500">Aprueba o rechaza las publicaciones recientes</p></div>
        <div className="mt-5 space-y-3">{materials.map((material) => <div key={material.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{material.title}</h3><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[material.review_status] ?? statusStyles.pending}`}>{material.review_status === "approved" ? "Aprobado" : material.review_status === "rejected" ? "Rechazado" : "Pendiente"}</span></div><p className="mt-1 text-xs text-slate-500">{material.subject?.code} · {material.subject?.name} · {material.author?.first_name} {material.author?.last_name}</p></div><div className="flex gap-2"><button disabled={reviewingId === material.id} onClick={()=>handleReview(material.id,"approved")} title="Aprobar" className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"><CheckCircle2 size={18}/></button><button disabled={reviewingId === material.id} onClick={()=>handleReview(material.id,"rejected")} title="Rechazar" className="rounded-xl bg-red-50 p-2.5 text-red-700 hover:bg-red-100 disabled:opacity-50"><XCircle size={18}/></button></div></div></div>)}{!materials.length && <p className="py-8 text-center text-sm text-slate-500">No hay materiales pendientes de moderación.</p>}</div>
      </div>
    </section>
  </div>
}
