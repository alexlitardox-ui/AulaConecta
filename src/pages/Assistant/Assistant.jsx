import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Bot,
  BookOpen,
  GraduationCap,
  LoaderCircle,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react"

import { askAulaConectaAssistant } from "../../services/assistantService"

const examples = [
  "Necesito ayuda con regresión lineal",
  "Muéstrame materiales de bases de datos",
  "¿Hay grupos de cálculo disponibles?",
  "¿Quién puede ayudarme con programación?",
]

function ResultSection({ title, icon: Icon, items, renderItem }) {
  if (!items?.length) return null

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} recomendaciones</p>
        </div>
      </div>

      <div className="space-y-3">{items.map(renderItem)}</div>
    </section>
  )
}

export default function Assistant() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [answer, setAnswer] = useState(null)

  const hasResults = useMemo(() => answer?.totalResults > 0, [answer])

  async function handleSubmit(event) {
    event?.preventDefault()
    if (loading) return

    setLoading(true)
    setError("")

    try {
      const response = await askAulaConectaAssistant(query)
      setAnswer(response)
    } catch (requestError) {
      setError(requestError.message || "No se pudo procesar la consulta.")
    } finally {
      setLoading(false)
    }
  }

  function applyExample(example) {
    setQuery(example)
    setAnswer(null)
    setError("")
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-9 text-white shadow-2xl shadow-slate-950/10 sm:px-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-bold text-blue-100">
              <Sparkles size={16} /> AulaConecta AI
            </div>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              Encuentra ayuda académica usando la información real de la plataforma.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Busca materiales, grupos, solicitudes y estudiantes destacados desde una sola consulta.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <Bot size={25} />
              </div>
              <div>
                <p className="font-black">Asistente inteligente</p>
                <p className="text-sm text-slate-300">Búsqueda académica contextual</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="assistant-query" className="text-sm font-black text-slate-700 dark:text-slate-200">
            ¿Qué necesitas encontrar?
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                id="assistant-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ejemplo: necesito ayuda con cálculo integral"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || query.trim().length < 3}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="animate-spin" size={20} /> : <Send size={19} />}
              {loading ? "Buscando..." : "Consultar"}
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => applyExample(example)}
              className="rounded-full border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}
      </section>

      {answer && (
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Bot size={20} />
            </div>
            <div>
              <p className="font-black text-blue-950 dark:text-blue-100">Respuesta de AulaConecta AI</p>
              <p className="mt-1 leading-7 text-blue-800 dark:text-blue-200">{answer.summary}</p>
            </div>
          </div>
        </section>
      )}

      {answer && !hasResults && (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <MessageSquareText className="mx-auto text-slate-400" size={38} />
          <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Intenta con otra búsqueda</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-500 dark:text-slate-400">
            Usa el nombre de una materia, un tema específico o palabras como “materiales”, “grupos” o “tutores”.
          </p>
        </section>
      )}

      {hasResults && (
        <div className="grid gap-5 xl:grid-cols-2">
          <ResultSection
            title="Materiales recomendados"
            icon={BookOpen}
            items={answer.results.materials}
            renderItem={(material) => (
              <Link key={material.id} to="/dashboard/materiales" className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-900 dark:text-white">{material.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.subject?.name || "Sin materia"} · {material.material_type || "Archivo"}</p>
                </div>
                <ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" size={18} />
              </Link>
            )}
          />

          <ResultSection
            title="Grupos relacionados"
            icon={Users}
            items={answer.results.groups}
            renderItem={(group) => (
              <Link key={group.id} to="/dashboard/grupos" className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-900 dark:text-white">{group.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.subject?.name || "Sin materia"} · {group.modality || "Modalidad por confirmar"}</p>
                </div>
                <ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" size={18} />
              </Link>
            )}
          />

          <ResultSection
            title="Solicitudes donde puedes participar"
            icon={GraduationCap}
            items={answer.results.requests}
            renderItem={(request) => (
              <Link key={request.id} to={`/dashboard/solicitudes/${request.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-900 dark:text-white">{request.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{request.subject?.name || request.topic || "Solicitud académica"}</p>
                </div>
                <ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" size={18} />
              </Link>
            )}
          />

          <ResultSection
            title="Estudiantes destacados"
            icon={Sparkles}
            items={answer.results.tutors}
            renderItem={(tutor) => (
              <Link key={tutor.id} to={`/dashboard/usuarios/${tutor.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    {tutor.avatar_url ? <img src={tutor.avatar_url} alt="" className="h-full w-full object-cover" /> : `${tutor.first_name?.[0] || "E"}${tutor.last_name?.[0] || ""}`}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-900 dark:text-white">{tutor.first_name} {tutor.last_name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">⭐ {Number(tutor.rating || 0).toFixed(1)} · {tutor.completed_tutoring || 0} tutorías</p>
                  </div>
                </div>
                <ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" size={18} />
              </Link>
            )}
          />
        </div>
      )}

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
        <strong>Importante:</strong> este asistente recomienda contenido usando coincidencias y datos disponibles en AulaConecta. No reemplaza la orientación de un docente ni genera respuestas académicas externas.
      </section>
    </div>
  )
}
