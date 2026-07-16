import { useEffect, useMemo, useState } from "react"
import { Crown, Filter, Plus, RefreshCw, Search, ShieldCheck, UserCheck, Users } from "lucide-react"
import GroupCard from "../../components/Groups/GroupCard"
import PendingMemberCard from "../../components/Groups/PendingMemberCard"
import ModuleTabs from "../../components/Navigation/ModuleTabs"
import { groupTabs } from "../../components/Navigation/moduleTabsConfig"
import { Button, EmptyState, FeedbackAlert, LoadingState, MetricCard, PageHeader } from "../../components/UI"
import { deleteOwnStudyGroup, getMyStudyGroups, getPendingGroupMembers, updateGroupMembershipStatus } from "../../services/groupService"

function MyGroups() {
  const [groups, setGroups] = useState([])
  const [pendingMembers, setPendingMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info")

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

  async function handleDeleteGroup(group) {
    if (!window.confirm(`¿Eliminar definitivamente el grupo “${group.name}”? También se eliminarán sus membresías.`)) return
    setDeletingId(group.id)
    setMessage("")
    try {
      await deleteOwnStudyGroup(group.id)
      setGroups((current) => current.filter((item) => item.id !== group.id))
      setPendingMembers((current) => current.filter((item) => item.group_id !== group.id))
      setMessage("Grupo eliminado correctamente.")
      setMessageType("success")
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo eliminar el grupo.")
      setMessageType("error")
    } finally {
      setDeletingId(null)
    }
  }

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
        <ModuleTabs label="Navegación de grupos de estudio" items={groupTabs} />
        <PageHeader
          eyebrow="Mi comunidad"
          icon={Users}
          title="Mis grupos de estudio"
          description="Administra los grupos que creaste y aquellos a los que te uniste."
          actions={
            <>
              <Button as="link" to="/dashboard/grupos" variant="secondary">Explorar grupos</Button>
              <Button as="link" to="/dashboard/grupos/nuevo"><Plus size={19} /> Crear grupo</Button>
            </>
          }
        />

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Users} label="Total de grupos" value={stats.total} />
          <MetricCard icon={Crown} label="Creados por ti" value={stats.created} tone="amber" />
          <MetricCard icon={ShieldCheck} label="Grupos unidos" value={stats.joined} tone="emerald" />
          <MetricCard icon={UserCheck} label="Pendientes" value={stats.pending} tone="indigo" />
        </div>

        {message ? <FeedbackAlert type={messageType} className="mt-6">{message}</FeedbackAlert> : null}

        {!loading && pendingMembers.length > 0 ? (
          <section className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-500 p-3 text-white"><UserCheck size={23} /></div>
              <div><h2 className="text-xl font-black text-slate-900">Solicitudes pendientes</h2><p className="mt-1 text-sm text-slate-600">{pendingMembers.length} estudiante{pendingMembers.length === 1 ? "" : "s"} desea{pendingMembers.length === 1 ? "" : "n"} entrar a tus grupos privados.</p></div>
            </div>
            <div className="mt-6 space-y-4">{pendingMembers.map((membership) => <PendingMemberCard key={membership.id} membership={membership} processing={processingId === membership.id} onAccept={(item) => handleMembershipUpdate(item, "accepted")} onReject={(item) => handleMembershipUpdate(item, "rejected")} />)}</div>
          </section>
        ) : null}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><Filter size={18} className="text-blue-600" /> Organizar grupos</div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nombre o materia..." className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="all">Todos mis grupos</option><option value="created">Creados por mí</option><option value="joined">Me uní</option></select>
            <Button variant="secondary" onClick={loadData} disabled={loading}><RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Actualizar</Button>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Cargando tus grupos..." />
        ) : filteredGroups.length === 0 ? (
          <EmptyState icon={Users} title="No hay grupos para mostrar" description="Cambia los filtros, crea un grupo o explora los disponibles." actionLabel="Explorar grupos" actionTo="/dashboard/grupos" />
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-2">{filteredGroups.map((group) => <GroupCard key={group.id} group={group} showJoinButton={false} showDelete={group.isCreator} onDelete={handleDeleteGroup} deleting={deletingId === group.id} />)}</div>
        )}
      </section>
    </main>
  )
}

export default MyGroups
