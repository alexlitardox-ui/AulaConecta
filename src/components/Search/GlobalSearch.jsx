import { useEffect, useRef, useState } from "react"
import {
  BookOpen,
  FileText,
  Search,
  User,
  Users,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { globalSearch } from "../../services/searchService"

const initialResults = {
  requests: [],
  groups: [],
  materials: [],
  users: [],
}

function GlobalSearch() {
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState(initialResults)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      )
    }
  }, [])

  useEffect(() => {
    const cleanTerm = searchTerm.trim()

    if (cleanTerm.length < 2) {
      setResults(initialResults)
      setOpen(false)
      setError("")
      return
    }

    let active = true

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      setError("")

      try {
        const data = await globalSearch(cleanTerm)

        if (!active) return

        setResults(data)
        setOpen(true)
      } catch (searchError) {
        console.error(searchError)

        if (!active) return

        setError("No se pudo completar la búsqueda.")
        setOpen(true)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }, 350)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [searchTerm])

  function handleNavigate(path) {
    navigate(path)
    setSearchTerm("")
    setResults(initialResults)
    setOpen(false)
  }

  const totalResults =
    results.requests.length +
    results.groups.length +
    results.materials.length +
    results.users.length

  return (
    <div ref={containerRef} className="relative w-full">
      <Search
        size={19}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="search"
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(event.target.value)
        }
        onFocus={() => {
          if (searchTerm.trim().length >= 2) {
            setOpen(true)
          }
        }}
        placeholder="Buscar tutorías, grupos, materiales o estudiantes..."
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      {searchTerm && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setSearchTerm("")
            setResults(initialResults)
            setOpen(false)
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
      )}

      {open && (
        <section className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
              <p className="mt-3 text-sm text-slate-500">
                Buscando...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : totalResults === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search
                size={28}
                className="mx-auto text-slate-400"
              />

              <h2 className="mt-3 font-bold text-slate-900">
                Sin resultados
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Prueba con otro término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.requests.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Solicitudes
                  </p>

                  {results.requests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() =>
                        handleNavigate(
                          `/dashboard/solicitudes/${request.id}`,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <BookOpen size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {request.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {request.subject?.name || "Materia"} ·{" "}
                          {request.topic}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.groups.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Grupos
                  </p>

                  {results.groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        handleNavigate("/dashboard/grupos")
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <Users size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {group.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {group.subject?.name || "Materia"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.materials.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Materiales
                  </p>

                  {results.materials.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() =>
                        handleNavigate("/dashboard/materiales")
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <FileText size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {material.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {material.subject?.name || "Materia"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.users.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Estudiantes
                  </p>

                  {results.users.map((profile) => {
                    const fullName =
                      `${profile.first_name || ""} ${
                        profile.last_name || ""
                      }`.trim() || "Estudiante"

                    const initials =
                      `${profile.first_name?.charAt(0) || ""}${
                        profile.last_name?.charAt(0) || ""
                      }`.toUpperCase() || "ES"

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() =>
                          handleNavigate(
                            `/dashboard/usuarios/${encodeURIComponent(profile.id)}`,
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-blue-600">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                              {initials || <User size={18} />}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {fullName}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            Calificación:{" "}
                            {Number(profile.rating ?? 0).toFixed(1)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default GlobalSearch