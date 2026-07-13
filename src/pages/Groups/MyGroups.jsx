import { useEffect, useMemo, useState } from "react"
import { Crown, Filter, Plus, RefreshCw, Search, ShieldCheck, UserCheck, Users } from "lucide-react"
import { Link } from "react-router-dom"
import GroupCard from "../../components/Groups/GroupCard"
import PendingMemberCard from "../../components/Groups/PendingMemberCard"
import { getMyStudyGroups, getPendingGroupMembers, updateGroupMembershipStatus } from "../../services/groupService"

function MyGroups() {
  const [groups, setGroups] = useState([])
  const [pendingMembers, setPendingMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  async function loadData() {
    setLoading(true)
    setMessage("")
    try {
      const [groupsData, pendingData] = await Promise.all([getMyStudyGroups(), getPendingGroupMembers()])
      setGroups(groupsData)
      setPendingMembers(pendingData)
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron cargar tus grupos.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleMembershipUpdate(membership, newStatus) {
    const action = newStatus === "accepted" ? "aceptar" : "rechazar"
    if (!window.confirm(`¿Deseas ${action} esta solicitud de ingreso?`)) return
    setProcessingId(membership.id)
    setMessage("")
    try {
      await updateGroupMembershipStatus(membership.id, newStatus)
      setPendingMembers((current) => current.filter((item) => item.id !== membership.id))
      if (newStatus === "accepted") {
        setGroups((current) => current.map((group) => group.id === membership.group_id ? { ...group, memberCount: group.memberCount + 1 } : group))
      }
      setMessage(newStatus === "accepted" ? "Solicitud aceptada correctamente." : "Solicitud rechazada correctamente.")
      setMessageType("success")
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo actualizar la solicitud de ingreso.")
      setMessageType("error")
    } finally {
      setProcessingId(null)
    }
  }

  const stats = useMemo(() => ({
    total: groups.length,
    created: groups.filter((group) => group.isCreator).length,
    joined: groups.filter((group) => !group.isCreator && group.isMember).length,
    pending: pendingMembers.length + groups.filter((group) => group.membershipPending).length,
  }), [groups, pendingMembers])

  const filteredGroups = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return groups.filter((group) => {
      const matchesSearch = !search || group.name?.toLowerCase().includes(search) || group.subject?.name?.toLowerCase().includes(search) || group.subject?.code?.toLowerCase().includes(search)
      const matchesRole = roleFilter === "all" || (roleFilter === "created" ? group.isCreator : !group.isCreator)
      return matchesSearch && matchesRole
    })
  }, [groups, searchTerm, roleFilter])

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-700"><Users size={14} /> Mi comunidad</div>
            <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">Mis grupos de estudio</h1>
            <p className="mt-3 text-slate-600">Administra los grupos que creaste y aquellos a los que te uniste.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard/grupos" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Explorar grupos</Link>
            <Link to="/dashboard/grupos/nuevo" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"><Plus size={19} /> Crear grupo</Link>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Total de grupos" value={stats.total} />
          <Stat icon={Crown} label="Creados por ti" value={stats.created} />
          <Stat icon={ShieldCheck} label="Grupos unidos" value={stats.joined} />
          <Stat icon={UserCheck} label="Pendientes" value={stats.pending} />
        </div>

        {message && <div className={`mt-6 rounded-2xl border px-4 py-3 ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}

        {!loading && pendingMembers.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4"><div className="rounded-2xl bg-amber-500 p-3 text-white"><UserCheck size={23} /></div><div><h2 className="text-xl font-black text-slate-900">Solicitudes pendientes</h2><p className="mt-1 text-sm text-slate-600">{pendingMembers.length} estudiante{pendingMembers.length === 1 ? "" : "s"} desea{pendingMembers.length === 1 ? "" : "n"} entrar a tus grupos privados.</p></div></div>
            </div>
            <div className="mt-6 space-y-4">{pendingMembers.map((membership) => <PendingMemberCard key={membership.id} membership={membership} processing={processingId === membership.id} onAccept={(item) => handleMembershipUpdate(item, "accepted")} onReject={(item) => handleMembershipUpdate(item, "rejected")} />)}</div>
          </section>
        )}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Filter size={18} className="text-blue-600" /> Organizar grupos</div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nombre o materia..." className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="all">Todos mis grupos</option><option value="created">Creados por mí</option><option value="joined">Me uní</option></select>
            <button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Actualizar</button>
          </div>
        </div>

        {loading ? <div className="mt-12 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" /><p className="mt-4 text-slate-600">Cargando tus grupos...</p></div> : filteredGroups.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-black text-slate-900">No hay grupos para mostrar</h2><p className="mt-3 text-slate-500">Cambia los filtros, crea un grupo o explora los disponibles.</p><Link to="/dashboard/grupos" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white">Explorar grupos</Link></div> : <div className="mt-8 grid gap-6 xl:grid-cols-2">{filteredGroups.map((group) => <GroupCard key={group.id} group={group} showJoinButton={false} />)}</div>}
      </section>
    </main>
  )
}

function Stat({ icon: Icon, label, value }) { return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div><div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Icon size={22} /></div></div></article> }

export default MyGroups
