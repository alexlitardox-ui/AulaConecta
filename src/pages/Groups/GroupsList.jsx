import { useEffect, useMemo, useState } from "react"
import { Compass, Filter, Lock, Plus, RefreshCw, Search, Users } from "lucide-react"
import { Link } from "react-router-dom"
import GroupCard from "../../components/Groups/GroupCard"
import { getStudyGroups, joinStudyGroup } from "../../services/groupService"

import ModuleTabs from "../../components/Navigation/ModuleTabs"
import { groupTabs } from "../../components/Navigation/moduleTabsConfig"

function GroupsList() {
  const [groups, setGroups] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [modality, setModality] = useState("all")
  const [accessType, setAccessType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [joiningGroupId, setJoiningGroupId] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  async function loadGroups() {
    setLoading(true)
    setMessage("")
    try {
      setGroups(await getStudyGroups())
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron cargar los grupos de estudio.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGroups() }, [])

  async function handleJoin(group) {
    setJoiningGroupId(group.id)
    setMessage("")
    try {
      const result = await joinStudyGroup(group.id)
      setMessage(result === "pending" ? "Solicitud enviada. El creador debe aprobar tu ingreso." : "Te uniste al grupo correctamente.")
      setMessageType("success")
      await loadGroups()
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo completar la operación.")
      setMessageType("error")
    } finally {
      setJoiningGroupId(null)
    }
  }

  const stats = useMemo(() => ({
    total: groups.length,
    publicGroups: groups.filter((group) => group.access_type === "public").length,
    privateGroups: groups.filter((group) => group.access_type === "private").length,
    spots: groups.reduce((sum, group) => sum + Math.max((group.max_members || 0) - (group.memberCount || 0), 0), 0),
  }), [groups])

  const filteredGroups = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return groups.filter((group) => {
      const matchesSearch = !search || group.name?.toLowerCase().includes(search) || group.description?.toLowerCase().includes(search) || group.subject?.name?.toLowerCase().includes(search) || group.subject?.code?.toLowerCase().includes(search)
      return matchesSearch && (modality === "all" || group.modality === modality) && (accessType === "all" || group.access_type === accessType)
    })
  }, [groups, searchTerm, modality, accessType])

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <ModuleTabs label="Navegación de grupos de estudio" items={groupTabs} />
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-200"><Compass size={15} /> Comunidad académica</div>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">Encuentra tu próximo grupo de estudio</h1>
              <p className="mt-3 leading-7 text-slate-300">Conecta con estudiantes de tu carrera, organiza sesiones y avanza acompañado.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/dashboard/grupos/mios" className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20">Mis grupos</Link>
              <Link to="/dashboard/grupos/nuevo" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"><Plus size={19} /> Crear grupo</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Grupos disponibles" value={stats.total} />
          <Stat icon={Compass} label="Ingreso abierto" value={stats.publicGroups} />
          <Stat icon={Lock} label="Con aprobación" value={stats.privateGroups} />
          <Stat icon={Plus} label="Cupos disponibles" value={stats.spots} />
        </div>

        {message && <div className={`mt-6 rounded-2xl border px-4 py-3 ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Filter size={18} className="text-blue-600" /> Buscar y filtrar</div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_200px_200px_auto]">
            <div className="relative"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nombre, materia, código o descripción..." className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div>
            <select value={modality} onChange={(e) => setModality(e.target.value)} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="all">Toda modalidad</option><option value="virtual">Virtual</option><option value="in_person">Presencial</option></select>
            <select value={accessType} onChange={(e) => setAccessType(e.target.value)} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="all">Todo acceso</option><option value="public">Públicos</option><option value="private">Privados</option></select>
            <button type="button" onClick={loadGroups} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Actualizar</button>
          </div>
        </div>

        {loading ? <Loading /> : filteredGroups.length === 0 ? <Empty /> : <div className="mt-8 grid gap-6 xl:grid-cols-2">{filteredGroups.map((group) => <GroupCard key={group.id} group={group} onJoin={handleJoin} joining={joiningGroupId === group.id} />)}</div>}
      </section>
    </main>
  )
}

function Stat({ icon: Icon, label, value }) { return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div><div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Icon size={22} /></div></div></article> }
function Loading() { return <div className="mt-12 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" /><p className="mt-4 text-slate-600">Cargando grupos...</p></div> }
function Empty() { return <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-black text-slate-900">No se encontraron grupos</h2><p className="mt-3 text-slate-500">Prueba con otros filtros o crea tu propio grupo.</p></div> }

export default GroupsList