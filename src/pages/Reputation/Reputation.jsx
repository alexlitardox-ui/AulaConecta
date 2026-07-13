import { useEffect, useMemo, useState } from "react"
import {
  Award,
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react"

import { getMyReviews } from "../../services/reputationService"

function formatDate(date) {
  if (!date) return ""

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

function RatingStars({ value, size = 18 }) {
  const roundedValue = Math.round(Number(value) || 0)

  return (
    <div className="flex items-center gap-1" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= roundedValue
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }
        />
      ))}
    </div>
  )
}

function getReputationLevel(average, total) {
  if (total >= 20 && average >= 4.7) {
    return {
      name: "Mentor destacado",
      description: "Excelente valoración y trayectoria constante.",
      next: null,
      progress: 100,
    }
  }

  if (total >= 10 && average >= 4.3) {
    return {
      name: "Tutor confiable",
      description: "Has construido una reputación académica sólida.",
      next: "Mentor destacado",
      progress: Math.min(99, Math.round((total / 20) * 100)),
    }
  }

  if (total >= 3 && average >= 4) {
    return {
      name: "Buen compañero",
      description: "Tus primeras tutorías muestran resultados positivos.",
      next: "Tutor confiable",
      progress: Math.min(99, Math.round((total / 10) * 100)),
    }
  }

  return {
    name: "Reputación en crecimiento",
    description: "Completa tutorías para construir tu historial académico.",
    next: "Buen compañero",
    progress: Math.min(99, Math.round((total / 3) * 100)),
  }
}

function Reputation() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [ratingFilter, setRatingFilter] = useState("all")

  async function loadReviews() {
    setLoading(true)
    setMessage("")

    try {
      const data = await getMyReviews()
      setReviews(data)
    } catch (error) {
      console.error(error)
      setMessage("No se pudo cargar la información de reputación.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const statistics = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    if (reviews.length === 0) {
      return {
        average: 0,
        clarity: 0,
        punctuality: 0,
        respect: 0,
        total: 0,
        distribution,
        comments: 0,
      }
    }

    const totals = reviews.reduce(
      (accumulator, review) => {
        const rating = Number(review.rating || 0)
        const roundedRating = Math.max(1, Math.min(5, Math.round(rating)))
        distribution[roundedRating] += 1

        return {
          rating: accumulator.rating + rating,
          clarity: accumulator.clarity + Number(review.clarity || 0),
          punctuality:
            accumulator.punctuality + Number(review.punctuality || 0),
          respect: accumulator.respect + Number(review.respect || 0),
          comments: accumulator.comments + (review.comment?.trim() ? 1 : 0),
        }
      },
      {
        rating: 0,
        clarity: 0,
        punctuality: 0,
        respect: 0,
        comments: 0,
      },
    )

    return {
      average: totals.rating / reviews.length,
      clarity: totals.clarity / reviews.length,
      punctuality: totals.punctuality / reviews.length,
      respect: totals.respect / reviews.length,
      total: reviews.length,
      distribution,
      comments: totals.comments,
    }
  }, [reviews])

  const level = useMemo(
    () => getReputationLevel(statistics.average, statistics.total),
    [statistics.average, statistics.total],
  )

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return reviews.filter((review) => {
      const reviewerName = review.reviewer
        ? `${review.reviewer.first_name || ""} ${review.reviewer.last_name || ""}`
        : "Estudiante"
      const matchesSearch =
        !normalizedSearch ||
        reviewerName.toLowerCase().includes(normalizedSearch) ||
        review.comment?.toLowerCase().includes(normalizedSearch)
      const matchesRating =
        ratingFilter === "all" ||
        Math.round(Number(review.rating || 0)) === Number(ratingFilter)

      return matchesSearch && matchesRating
    })
  }, [reviews, search, ratingFilter])

  const statCards = [
    {
      label: "Calificación general",
      value: statistics.total > 0 ? statistics.average.toFixed(1) : "—",
      description: "Promedio de todas tus valoraciones.",
      icon: Star,
    },
    {
      label: "Claridad",
      value: statistics.total > 0 ? statistics.clarity.toFixed(1) : "—",
      description: "Qué tan claras fueron tus explicaciones.",
      icon: Sparkles,
    },
    {
      label: "Puntualidad",
      value: statistics.total > 0 ? statistics.punctuality.toFixed(1) : "—",
      description: "Cumplimiento de horarios acordados.",
      icon: Clock3,
    },
    {
      label: "Respeto",
      value: statistics.total > 0 ? statistics.respect.toFixed(1) : "—",
      description: "Trato durante las tutorías.",
      icon: ShieldCheck,
    },
  ]

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-xl shadow-blue-100 sm:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-100">
                <Award size={15} />
                Confianza académica
              </div>

              <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Mi reputación</h1>

              <p className="mt-3 max-w-xl leading-7 text-blue-100">
                Revisa tu progreso, conoce qué valoran los estudiantes y usa cada comentario para mejorar tus próximas tutorías.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-200">Nivel actual</p>
                <p className="mt-1 text-xl font-bold">{level.name}</p>
              </div>

              <button
                type="button"
                onClick={loadReviews}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {message}
          </div>
        )}

        {loading ? (
          <>
            <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-white" />
              ))}
            </section>
            <div className="mt-8 h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          </>
        ) : (
          <>
            <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <article
                    key={stat.label}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Icon size={24} />
                      </div>
                      <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                    </div>
                    <h2 className="mt-5 font-bold text-slate-900">{stat.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{stat.description}</p>
                  </article>
                )
              })}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
              <aside className="space-y-6">
                <article className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-7 text-white shadow-xl shadow-blue-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                      <Trophy size={29} />
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{statistics.total} reseñas</span>
                  </div>

                  <p className="mt-6 text-sm font-medium text-blue-100">Calificación general</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-5xl font-bold">
                      {statistics.total > 0 ? statistics.average.toFixed(1) : "—"}
                    </span>
                    {statistics.total > 0 && <span className="pb-1 text-blue-100">/ 5</span>}
                  </div>
                  <div className="mt-4">
                    <RatingStars value={statistics.average} size={21} />
                  </div>

                  <div className="mt-7 rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-blue-100">{level.name}</p>
                        <p className="mt-1 text-sm font-semibold">{level.description}</p>
                      </div>
                      <Award size={24} />
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-white transition-all" style={{ width: `${level.progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-blue-100">
                      <span>{level.progress}%</span>
                      <span>{level.next ? `Próximo: ${level.next}` : "Nivel máximo"}</span>
                    </div>
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">Distribución</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">Valoraciones por estrella</h2>
                    </div>
                    <Star className="fill-amber-400 text-amber-400" size={25} />
                  </div>

                  <div className="mt-6 space-y-4">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = statistics.distribution[rating]
                      const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0
                      return (
                        <div key={rating} className="grid grid-cols-[32px_1fr_28px] items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            {rating}<Star size={13} className="fill-amber-400 text-amber-400" />
                          </span>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-right text-slate-500">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </article>

                <article className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
                  <CheckCircle2 size={26} className="text-blue-600" />
                  <h2 className="mt-4 font-bold text-slate-900">Cómo seguir mejorando</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <li>• Explica los temas con ejemplos claros.</li>
                    <li>• Cumple el horario acordado.</li>
                    <li>• Mantén una comunicación respetuosa.</li>
                    <li>• Prepara la tutoría con anticipación.</li>
                  </ul>
                </article>
              </aside>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Opiniones recibidas</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Comentarios de estudiantes</h2>
                    <p className="mt-2 text-slate-600">
                      {statistics.comments} de {statistics.total} valoraciones incluyen comentario.
                    </p>
                  </div>

                  {reviews.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="relative block">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Buscar opinión..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-blue-400 focus:bg-white sm:w-56"
                        />
                        {search && (
                          <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            <X size={17} />
                          </button>
                        )}
                      </label>

                      <label className="relative block">
                        <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <select
                          value={ratingFilter}
                          onChange={(event) => setRatingFilter(event.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white sm:w-40"
                        >
                          <option value="all">Todas</option>
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <option key={rating} value={rating}>{rating} estrellas</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <MessageSquare size={27} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">Todavía no tienes valoraciones</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Cuando completes una tutoría y otro estudiante te califique, su opinión aparecerá aquí.
                    </p>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                    <Search className="mx-auto text-slate-400" size={30} />
                    <h3 className="mt-4 font-bold text-slate-900">No encontramos coincidencias</h3>
                    <p className="mt-2 text-sm text-slate-500">Prueba con otro texto o cambia el filtro de estrellas.</p>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5">
                    {filteredReviews.map((review) => {
                      const reviewerName = review.reviewer
                        ? `${review.reviewer.first_name || ""} ${review.reviewer.last_name || ""}`.trim()
                        : "Estudiante"
                      const reviewerInitials = review.reviewer
                        ? `${review.reviewer.first_name?.charAt(0) || ""}${review.reviewer.last_name?.charAt(0) || ""}`.toUpperCase()
                        : "ES"

                      return (
                        <section key={review.id} className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-sm">
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                            {review.reviewer?.avatar_url ? (
                              <img src={review.reviewer.avatar_url} alt={reviewerName} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                                {reviewerInitials}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h3 className="font-bold text-slate-900">{reviewerName}</h3>
                                  <p className="mt-1 text-xs text-slate-400">{formatDate(review.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                                  <RatingStars value={review.rating} />
                                  <span className="font-bold text-slate-900">{Number(review.rating).toFixed(1)}</span>
                                </div>
                              </div>

                              {review.comment ? (
                                <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">“{review.comment}”</p>
                              ) : (
                                <p className="mt-4 italic text-slate-400">El estudiante no dejó un comentario.</p>
                              )}

                              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                {[
                                  ["Claridad", review.clarity, Sparkles],
                                  ["Puntualidad", review.punctuality, Clock3],
                                  ["Respeto", review.respect, ShieldCheck],
                                ].map(([label, value, Icon]) => (
                                  <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs text-slate-500">{label}</p>
                                      <Icon size={15} className="text-blue-500" />
                                    </div>
                                    <p className="mt-1 font-bold text-slate-900">{value}/5</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>
                      )
                    })}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default Reputation
