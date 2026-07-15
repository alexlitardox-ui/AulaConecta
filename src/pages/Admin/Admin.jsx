import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BookOpen, CheckCircle2, Clock3, FileText, GraduationCap, RefreshCw, Search, ShieldCheck, Trash2, UserCog, Users, XCircle } from "lucide-react"
import { cancelAdminSession, deleteAdminGroup, deleteAdminMaterial, deleteAdminRequest, getAdminAccess, getAdminDashboard, reviewMaterial, setUserRole } from "../../services/adminService"

const tabs = [
  ["materials", "Materiales"], ["requests", "Solicitudes"], ["groups", "Grupos"], ["sessions", "Tutorías"], ["users", "Usuarios"], ["audit", "Auditoría"],
]
const statusClass = "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"

function StatCard({ icon: Icon, label, value, detail }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><span className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><Icon size={22} /></span></div></div>
}

function PersonName({ person }) { return person ? `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "Usuario" : "Usuario no disponible" }

export default function Admin() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("materials")
  const [workingId, setWorkingId] = useState(null)

  async function load() {
    setLoading(true); setError("")
    try { const access = await getAdminAccess(); setAllowed(access.allowed); if (access.allowed) setData(await getAdminDashboard()) }
    catch (err) { setError(err.message || "No se pudo cargar el panel.") }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const list = useMemo(() => {
    const values = tab === "audit" ? data?.auditLogs : data?.[tab]
    const q = search.trim().toLowerCase()
    if (!q) return values ?? []
    return (values ?? []).filter((item) => JSON.stringify(item).toLowerCase().includes(q))
  }, [data, search, tab])

  async function runAction(id, action, success) {
    setWorkingId(id); setError(""); setMessage("")
    try { await action(); setMessage(success); await load() }
    catch (err) { setError(err.message || "No se pudo completar la acción.") }
    finally { setWorkingId(null) }
  }
  function askReason(label) { return window.prompt(`Motivo para ${label}:`, "Dato de prueba")?.trim() || "Administración del sistema" }

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><RefreshCw className="animate-spin text-blue-600" size={34} /></div>
  if (error && !data) return <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center"><AlertCircle className="mx-auto text-red-600" size={38}/><h1 className="mt-4 text-xl font-bold">No se pudo abrir Administración</h1><p className="mt-2 text-sm">{error}</p><button onClick={load} className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">Reintentar</button></div>
  if (!allowed) return <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"><ShieldCheck className="mx-auto text-amber-600" size={42}/><h1 className="mt-4 text-2xl font-black">Acceso restringido</h1><p className="mt-2">Tu cuenta no tiene permisos administrativos.</p></div>

  const { stats, role } = data
  return <div className="space-y-7 pb-10">
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-7 text-white shadow-xl md:p-9"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest"><ShieldCheck size={15}/> {role}</span><h1 className="mt-5 text-3xl font-black md:text-4xl">Control general de AulaConecta</h1><p className="mt-3 max-w-2xl text-sm text-blue-100 md:text-base">Gestiona publicaciones, roles y acciones administrativas con trazabilidad.</p></div><button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-900"><RefreshCw size={18}/> Actualizar</button></div></section>

    {(message || error) && <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>} {error || message}</div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><StatCard icon={Users} label="Usuarios" value={stats.users} detail="Perfiles registrados"/><StatCard icon={BookOpen} label="Solicitudes" value={stats.requests} detail="Publicaciones académicas"/><StatCard icon={GraduationCap} label="Tutorías" value={stats.sessions} detail="Sesiones registradas"/><StatCard icon={Users} label="Grupos" value={stats.groups} detail="Comunidades creadas"/><StatCard icon={FileText} label="Materiales" value={stats.materials} detail="Archivos registrados"/><StatCard icon={Clock3} label="Por revisar" value={stats.pendingMaterials} detail="Moderación pendiente"/></section>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-2">{tabs.map(([value,label]) => <button key={value} onClick={()=>setTab(value)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab===value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{label}</button>)}</div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar en esta sección" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 xl:w-72"/></div></div>
      <div className="mt-5 space-y-3">
        {tab === "materials" && list.map((item)=><div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><b>{item.title}</b><span className={statusClass}>{item.review_status}</span></div><p className="mt-1 text-xs text-slate-500">{item.subject?.code} · <PersonName person={item.author}/></p></div><div className="flex gap-2">{item.review_status === "pending" && <><button disabled={workingId===item.id} onClick={()=>runAction(item.id,()=>reviewMaterial(item.id,"approved"),"Material aprobado.")} className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><CheckCircle2 size={18}/></button><button disabled={workingId===item.id} onClick={()=>runAction(item.id,()=>reviewMaterial(item.id,"rejected"),"Material rechazado.")} className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><XCircle size={18}/></button></>}<button disabled={workingId===item.id} onClick={()=>{if(window.confirm("¿Eliminar definitivamente este material?")){const reason=askReason("eliminar el material");runAction(item.id,()=>deleteAdminMaterial(item,reason),"Material eliminado y acción registrada.")}}} className="rounded-xl bg-red-50 p-2.5 text-red-700"><Trash2 size={18}/></button></div></div>)}
        {tab === "requests" && list.map((item)=><div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div><b>{item.title}</b><p className="text-xs text-slate-500"><PersonName person={item.author}/> · {item.status}</p></div><button onClick={()=>{if(window.confirm("¿Eliminar esta solicitud y sus datos relacionados?")){const reason=askReason("eliminar la solicitud");runAction(item.id,()=>deleteAdminRequest(item.id,reason),"Solicitud eliminada.")}}} className="rounded-xl bg-red-50 p-2.5 text-red-700"><Trash2 size={18}/></button></div>)}
        {tab === "groups" && list.map((item)=><div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div><b>{item.name}</b><p className="text-xs text-slate-500"><PersonName person={item.author}/> · {item.status}</p></div><button onClick={()=>{if(window.confirm("¿Eliminar este grupo y sus membresías?")){const reason=askReason("eliminar el grupo");runAction(item.id,()=>deleteAdminGroup(item.id,reason),"Grupo eliminado.")}}} className="rounded-xl bg-red-50 p-2.5 text-red-700"><Trash2 size={18}/></button></div>)}
        {tab === "sessions" && list.map((item)=><div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div><b>{item.subject?.name ?? "Tutoría"}</b><p className="text-xs text-slate-500"><PersonName person={item.student}/> / <PersonName person={item.tutor}/> · {item.status}</p></div>{!["completed","cancelled"].includes(item.status) && <button onClick={()=>{if(window.confirm("¿Cancelar esta tutoría?")){const reason=askReason("cancelar la tutoría");runAction(item.id,()=>cancelAdminSession(item.id,reason),"Tutoría cancelada.")}}} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">Cancelar</button>}</div>)}
        {tab === "users" && list.map((item)=><div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 font-bold text-blue-700"><UserCog size={19}/></span><div><b>{item.first_name} {item.last_name}</b><p className="text-xs text-slate-500">Rol actual: {item.role ?? (item.is_admin ? "admin" : "student")}</p></div></div>{role === "admin" && <select value={item.role ?? (item.is_admin ? "admin" : "student")} onChange={(e)=>runAction(item.id,()=>setUserRole(item.id,e.target.value),"Rol actualizado.")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="student">Estudiante</option><option value="moderator">Moderador</option><option value="admin">Administrador</option></select>}</div>)}
        {tab === "audit" && list.map((item)=><div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-wrap items-center gap-2"><b>{item.action}</b><span className={statusClass}>{item.entity_type}</span></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300"><PersonName person={item.actor}/> · {item.reason || "Sin motivo registrado"}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString("es-EC")}</p></div>)}
        {!list.length && <p className="py-10 text-center text-sm text-slate-500">No hay registros para mostrar.</p>}
      </div>
    </section>
  </div>
}
