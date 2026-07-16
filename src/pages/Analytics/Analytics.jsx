import { useEffect, useMemo, useState } from "react"
import { Activity, BarChart3, BookOpen, Clock3, Download, GraduationCap, Heart, RefreshCw, ShieldCheck, Star, Target, TrendingUp, Trophy, Users } from "lucide-react"
import AnalyticsCard from "../../components/analytics/AnalyticsCard"
import ChartCard from "../../components/analytics/ChartCard"
import { getAdminAnalytics, getUserAnalytics } from "../../services/analyticsService"

function BarList({ items = [], valueKey = "value", empty = "No hay datos disponibles." }) {
  const max = Math.max(...items.map(item => Number(item[valueKey] || 0)), 1)
  if (!items.length) return <EmptyChart text={empty} />
  return <div className="space-y-4">{items.map(item => <div key={item.name}>
    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-semibold text-slate-700 dark:text-slate-200">{item.name}</span><strong className="text-slate-950 dark:text-white">{item[valueKey]}</strong></div>
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all" style={{ width: `${Math.max(5, (Number(item[valueKey] || 0) / max) * 100)}%` }} /></div>
  </div>)}</div>
}

function MonthlyChart({ rows = [], admin = false }) {
  const max = Math.max(...rows.flatMap(item => [item.tutorias, item.solicitudes, item.materiales, admin ? item.usuarios : 0]), 1)
  if (!rows.some(item => item.tutorias || item.solicitudes || item.materiales || item.usuarios)) return <EmptyChart text="Aún no hay actividad suficiente para esta gráfica." />
  return <div className="grid h-64 grid-cols-6 items-end gap-3">{rows.map(item => <div key={item.key} className="flex h-full flex-col justify-end gap-2">
    <div className="flex flex-1 items-end justify-center gap-1">
      <div title={`Tutorías: ${item.tutorias}`} className="w-2.5 rounded-t bg-blue-600" style={{ height: `${Math.max(item.tutorias ? 8 : 0, (item.tutorias / max) * 100)}%` }} />
      <div title={`Solicitudes: ${item.solicitudes}`} className="w-2.5 rounded-t bg-violet-600" style={{ height: `${Math.max(item.solicitudes ? 8 : 0, (item.solicitudes / max) * 100)}%` }} />
      <div title={`Materiales: ${item.materiales}`} className="w-2.5 rounded-t bg-emerald-600" style={{ height: `${Math.max(item.materiales ? 8 : 0, (item.materiales / max) * 100)}%` }} />
      {admin && <div title={`Usuarios: ${item.usuarios}`} className="w-2.5 rounded-t bg-amber-500" style={{ height: `${Math.max(item.usuarios ? 8 : 0, (item.usuarios / max) * 100)}%` }} />}
    </div><span className="text-center text-xs font-bold capitalize text-slate-500">{item.label}</span>
  </div>)}</div>
}


function InsightCard({ icon: Icon, label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  }

  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start gap-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone] || tones.blue}`}><Icon size={21}/></span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white">{value}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </div>
  </article>
}

function EmptyChart({ text }) { return <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">{text}</div> }

export default function Analytics() {
  const [userData, setUserData] = useState(null)
  const [adminData, setAdminData] = useState(null)
  const [view, setView] = useState("personal")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true); setError("")
    try {
      const personal = await getUserAnalytics()
      setUserData(personal)
      setAdminData(personal.isAdmin ? await getAdminAnalytics() : null)
    } catch (err) {
      console.error(err)
      setError(err?.message || "No se pudieron cargar las estadísticas.")
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  const data = view === "admin" ? adminData : userData
  const cards = useMemo(() => view === "admin" && adminData ? [
    { title: "Usuarios", value: adminData.kpis.users, description: "Perfiles registrados", icon: Users, tone: "blue" },
    { title: "Tutorías", value: adminData.kpis.sessions, description: `${adminData.kpis.completedSessions} completadas`, icon: GraduationCap, tone: "violet" },
    { title: "Materiales", value: adminData.kpis.materials, description: `${adminData.kpis.pendingMaterials} por revisar`, icon: BookOpen, tone: "emerald" },
    { title: "Descargas", value: adminData.kpis.downloads, description: "Impacto de recursos", icon: Download, tone: "amber" },
  ] : userData ? [
    { title: "Tutorías", value: userData.kpis.sessions, description: `${userData.kpis.completed} completadas`, icon: GraduationCap, tone: "blue" },
    { title: "Materiales", value: userData.kpis.materials, description: `${userData.kpis.downloads} descargas`, icon: BookOpen, tone: "violet" },
    { title: "Favoritos", value: userData.kpis.favorites, description: "Recursos guardados", icon: Heart, tone: "emerald" },
    { title: "Reputación", value: Number(userData.kpis.rating || 0).toFixed(1), description: `${userData.kpis.reviews} reseñas`, icon: Star, tone: "amber" },
  ] : [], [view, userData, adminData])

  return <main className="px-4 py-6 sm:px-7 sm:py-8 xl:px-9"><div className="mx-auto max-w-7xl">
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl"/><div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100"><BarChart3 size={15}/> Centro analítico</div><h1 className="mt-4 text-3xl font-black sm:text-4xl">Tus datos, convertidos en decisiones</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Estadísticas seguras y ligeras, sin dependencias externas de gráficos.</p></div><button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/> Actualizar</button></div></section>

    {userData?.isAdmin && <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"><button onClick={() => setView("personal")} className={`rounded-xl px-4 py-2 text-sm font-bold ${view === "personal" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 dark:text-slate-300"}`}><Activity size={15} className="mr-2 inline"/>Mi actividad</button><button onClick={() => setView("admin")} className={`rounded-xl px-4 py-2 text-sm font-bold ${view === "admin" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 dark:text-slate-300"}`}><ShieldCheck size={15} className="mr-2 inline"/>Vista global</button></div>}

    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
    {!loading && view === "admin" && adminData?.insights && <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <InsightCard
        icon={TrendingUp}
        label="Crecimiento mensual"
        value={`${adminData.insights.userGrowth >= 0 ? "+" : ""}${adminData.insights.userGrowth.toFixed(1)}%`}
        detail={`${adminData.insights.currentMonthUsers} usuarios este mes frente a ${adminData.insights.previousMonthUsers} el mes anterior.`}
        tone="blue"
      />
      <InsightCard
        icon={Target}
        label="Tutorías completadas"
        value={`${adminData.insights.completionRate.toFixed(1)}%`}
        detail="Porcentaje de sesiones registradas que llegaron al estado completado."
        tone="emerald"
      />
      <InsightCard
        icon={BookOpen}
        label="Aprobación de materiales"
        value={`${adminData.insights.approvalRate.toFixed(1)}%`}
        detail={`${adminData.insights.pendingReports} reportes permanecen pendientes de moderación.`}
        tone="violet"
      />
      <InsightCard
        icon={Clock3}
        label="Hora de mayor actividad"
        value={adminData.peakHours?.[0]?.name ?? "Sin datos"}
        detail={adminData.peakHours?.[0] ? `${adminData.peakHours[0].value} acciones observadas en esa franja.` : "Todavía no existe actividad suficiente."}
        tone="amber"
      />
    </section>}
    {loading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800"/>)}</div> : data && <><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <AnalyticsCard key={card.title} {...card}/>)}</section><section className="mt-6 grid gap-6 xl:grid-cols-2">
      <ChartCard title={view === "admin" ? "Crecimiento de la plataforma" : "Actividad de los últimos 6 meses"} description="Tutorías, solicitudes y materiales por mes."><MonthlyChart rows={data.monthly} admin={view === "admin"}/></ChartCard>
      <ChartCard title="Materias con mayor actividad" description="Ranking según los registros disponibles."><BarList items={data.subjects} valueKey="total" empty="No existen materias con actividad registrada."/></ChartCard>
      <ChartCard title={view === "admin" ? "Estado de materiales" : "Distribución de tu actividad"} description="Composición de los registros disponibles."><BarList items={view === "admin" ? data.materialStatus : data.activity}/></ChartCard>
      <ChartCard title={view === "admin" ? "Usuarios por carrera" : "Estado de tus tutorías"} description={view === "admin" ? "Distribución de perfiles registrados." : "Situación actual de tus sesiones."}><BarList items={view === "admin" ? data.careers : data.sessionStatus}/></ChartCard>
      {view === "admin" && <ChartCard title="Horas con mayor actividad" description="Distribución aproximada a partir de mensajes, solicitudes, tutorías y materiales recientes."><BarList items={data.peakHours}/></ChartCard>}
      {view === "admin" && <ChartCard title="Indicadores destacados" description="Hallazgos automáticos generados a partir de los datos actuales."><div className="grid gap-3 sm:grid-cols-2">
        <InsightCard icon={Trophy} label="Tutor mejor valorado" value={data.insights.topTutor?.name ?? "Sin reseñas"} detail={data.insights.topTutor ? `${data.insights.topTutor.rating.toFixed(1)} estrellas en ${data.insights.topTutor.reviews} reseñas.` : "Aún no existen reseñas suficientes."} tone="amber"/>
        <InsightCard icon={Download} label="Material más descargado" value={data.insights.topMaterial?.title ?? "Sin descargas"} detail={data.insights.topMaterial ? `${data.insights.topMaterial.downloads} descargas registradas.` : "Aún no existen descargas registradas."} tone="emerald"/>
        <InsightCard icon={Users} label="Carrera más activa" value={data.insights.topCareer?.name ?? "Sin datos"} detail={data.insights.topCareer ? `${data.insights.topCareer.total} perfiles registrados.` : "No existe información suficiente."} tone="blue"/>
        <InsightCard icon={BookOpen} label="Materia con mayor actividad" value={data.insights.topSubject?.name ?? "Sin datos"} detail={data.insights.topSubject ? `${data.insights.topSubject.total} registros relacionados.` : "No existe información suficiente."} tone="violet"/>
      </div></ChartCard>}
    </section></>}
  </div></main>
}
