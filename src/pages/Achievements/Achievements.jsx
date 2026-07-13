import { useEffect, useMemo, useState } from "react"
import { Award, BookOpen, GraduationCap, RefreshCw, Star, Trophy, Users } from "lucide-react"
import { useOutletContext } from "react-router-dom"
import { getLeaderboard, getLevelInfo, getMyGamification } from "../../services/gamificationService"

function Achievements() {
  const { user } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true); setError("")
    try {
      const [myStats, ranking] = await Promise.all([getMyGamification(), getLeaderboard(20)])
      setStats(myStats); setLeaderboard(ranking)
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar la gamificación. Ejecuta primero el archivo SQL en Supabase.")
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])
  const level = useMemo(() => getLevelInfo(stats?.xp ?? 0), [stats])
  const myPosition = leaderboard.findIndex(item => item.user_id === user?.id) + 1

  if (loading) return <main className="flex min-h-[65vh] items-center justify-center"><div className="text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-violet-600"/><p className="mt-4 font-semibold text-slate-600">Calculando progreso...</p></div></main>

  return (
    <main className="px-4 py-6 sm:px-7 sm:py-8 xl:px-9"><div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 p-7 text-white shadow-2xl sm:p-10">
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl"/>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold"><Trophy size={15}/> Logros y progreso</div><h1 className="mt-5 text-3xl font-black sm:text-5xl">{level.current.icon} {level.current.name}</h1><p className="mt-3 max-w-xl text-slate-300">Tu participación en tutorías, materiales, grupos y reseñas construye tu nivel académico.</p></div>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-200">Experiencia total</p><p className="mt-2 text-4xl font-black">{stats?.xp ?? 0} XP</p></div><div className="text-right text-sm text-slate-300">{level.next ? `${level.remaining} XP para ${level.next.name}` : "Nivel máximo"}</div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300" style={{width:`${level.progress}%`}}/></div></div>
        </div>
      </section>

      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [GraduationCap,"Tutorías completadas",stats?.completed_tutoring ?? 0,"text-blue-700 bg-blue-50"],
          [BookOpen,"Materiales aprobados",stats?.approved_materials ?? 0,"text-emerald-700 bg-emerald-50"],
          [Users,"Grupos creados",stats?.created_groups ?? 0,"text-violet-700 bg-violet-50"],
          [Star,"Reseñas de 5 estrellas",stats?.five_star_reviews ?? 0,"text-amber-700 bg-amber-50"],
        ].map(([Icon,label,value,style]) => <article key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-2xl p-3 ${style}`}><Icon size={22}/></div><p className="mt-4 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-semibold text-slate-500">{label}</p></article>)}
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Colección</p><h2 className="mt-1 text-2xl font-black text-slate-950">Tus insignias</h2></div><Award className="text-violet-600"/></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{stats?.achievements.map(item => <article key={item.key} className={`rounded-2xl border p-4 transition ${item.unlocked ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50 opacity-70"}`}><div className="flex gap-3"><div className="text-3xl grayscale-0">{item.unlocked ? item.icon : "🔒"}</div><div><div className="flex items-center gap-2"><h3 className="font-black text-slate-900">{item.title}</h3>{item.unlocked && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-900">DESBLOQUEADA</span>}</div><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></div></div></article>)}</div></section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-600">Comunidad</p><h2 className="mt-1 text-2xl font-black text-slate-950">Ranking</h2><p className="mt-1 text-sm text-slate-500">Tu posición: {myPosition || "sin clasificar"}</p></div><button onClick={loadData} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50" aria-label="Actualizar"><RefreshCw size={18}/></button></div><div className="mt-5 space-y-3">{leaderboard.slice(0,10).map((item,index) => { const initials=`${item.first_name?.[0]??""}${item.last_name?.[0]??""}`.toUpperCase(); return <article key={item.user_id} className={`flex items-center gap-3 rounded-2xl border p-3 ${item.user_id===user?.id ? "border-violet-300 bg-violet-50" : "border-slate-200"}`}><div className="w-8 text-center text-lg font-black">{index < 3 ? ["🥇","🥈","🥉"][index] : index+1}</div><div className="h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">{item.avatar_url ? <img src={item.avatar_url} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-xs font-black">{initials}</div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{item.first_name} {item.last_name}</p><p className="text-xs text-slate-500">{getLevelInfo(item.xp).current.name}</p></div><div className="text-right"><p className="font-black text-violet-700">{item.xp}</p><p className="text-[10px] font-bold text-slate-400">XP</p></div></article>})}</div></section>
      </div>
    </div></main>
  )
}
export default Achievements
