import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, GraduationCap, LoaderCircle, MessageCircle, Star, UserRound } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { getUserPublicProfile, getUserReviews } from "../../services/reputationService"

function UserProfile() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError("")
      try {
        const [profileResult, reviewsResult] = await Promise.allSettled([
          getUserPublicProfile(userId),
          getUserReviews(userId),
        ])

        if (!active) return

        if (profileResult.status === "rejected") {
          throw profileResult.reason
        }

        setProfile(profileResult.value)
        setReviews(
          reviewsResult.status === "fulfilled" ? reviewsResult.value : [],
        )

        if (reviewsResult.status === "rejected") {
          console.warn("No se pudieron cargar las reseñas públicas:", reviewsResult.reason)
        }
      } catch (loadError) {
        console.error(loadError)
        if (active) setError(loadError.message || "No se pudo cargar este perfil.")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [userId])

  const average = useMemo(() => {
    if (!reviews.length) return Number(profile?.rating ?? 0)
    return reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
  }, [profile, reviews])

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><LoaderCircle className="animate-spin text-blue-600" size={42} /></div>

  if (error || !profile) {
    return <div className="p-6 sm:p-8"><div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800"><p className="font-bold">No se pudo abrir el perfil</p><p className="mt-2">{error || "El usuario no existe o no está disponible."}</p><Link to="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 font-bold text-white"><ArrowLeft size={18}/>Volver</Link></div></div>
  }

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Estudiante"
  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "ES"

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-700"><ArrowLeft size={18}/>Volver</Link>
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
          <div className="px-6 pb-7 sm:px-8">
            <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-white bg-blue-600 shadow-lg dark:border-slate-900">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={fullName} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-2xl font-black text-white">{initials}</div>}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-slate-950 dark:text-white">{fullName}</h1>
                <p className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-300"><GraduationCap size={18}/>{profile.career?.name || "Carrera no especificada"}{profile.semester?.name ? ` · ${profile.semester.name}` : ""}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-5 py-3 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"><div className="flex items-center gap-2 text-xl font-black"><Star className="fill-current" size={21}/>{average.toFixed(1)}</div><p className="text-xs font-semibold">{reviews.length} reseñas</p></div>
            </div>
            <div className="mt-7 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-950/60"><h2 className="font-black text-slate-900 dark:text-white">Sobre este estudiante</h2><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{profile.bio || "Este estudiante todavía no ha añadido una biografía."}</p></div>
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><div className="flex items-center gap-2 font-black text-slate-900 dark:text-white"><UserRound size={19}/>Actividad</div><p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Tutorías completadas: <strong>{profile.completed_tutoring ?? 0}</strong></p><Link to={`/dashboard/chat?user=${encodeURIComponent(profile.id)}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white hover:bg-blue-700"><MessageCircle size={18}/>Enviar mensaje</Link></div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Reseñas recibidas</h2>
          <div className="mt-5 space-y-4">
            {reviews.length ? reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-900 dark:text-white">{`${review.reviewer?.first_name || ""} ${review.reviewer?.last_name || ""}`.trim() || "Estudiante"}</p><span className="flex items-center gap-1 font-black text-amber-600"><Star size={17} className="fill-current"/>{Number(review.rating || 0).toFixed(1)}</span></div>
                {review.comment && <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{review.comment}</p>}
              </article>
            )) : <p className="rounded-2xl bg-slate-50 p-5 text-slate-500 dark:bg-slate-950/60">Todavía no tiene reseñas.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserProfile
