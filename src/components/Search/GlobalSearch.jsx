import { useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen,
  FileText,
  LoaderCircle,
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

const RECENT_SEARCHES_KEY = "aulaconecta_recent_searches"
const MAX_RECENT_SEARCHES = 5

function GlobalSearch() {
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const selectedResultRef = useRef(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState(initialResults)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState([])

  useEffect(() => {
    try {
      const storedSearches = JSON.parse(
        localStorage.getItem(RECENT_SEARCHES_KEY) || "[]",
      )

      if (Array.isArray(storedSearches)) {
        setRecentSearches(storedSearches.slice(0, MAX_RECENT_SEARCHES))
      }
    } catch (storageError) {
      console.error(
        "No se pudieron cargar las búsquedas recientes:",
        storageError,
      )
    }
  }, [])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  useEffect(() => {
    function handleShortcut(event) {
      const target = event.target

      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()
        setOpen(true)

        window.setTimeout(() => {
          inputRef.current?.focus()
        }, 0)

        return
      }

      if (event.key === "Escape") {
        setOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        return
      }

      if (isTyping) return
    }

    window.addEventListener("keydown", handleShortcut)

    return () => {
      window.removeEventListener("keydown", handleShortcut)
    }
  }, [])

  useEffect(() => {
    const cleanTerm = searchTerm.trim()

    if (cleanTerm.length < 2) {
      setResults(initialResults)
      setError("")
      setSelectedIndex(-1)
      return
    }

    let active = true

    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      setError("")

      try {
        const data = await globalSearch(cleanTerm)

        if (!active) return

        setResults(data)
        setOpen(true)
        setSelectedIndex(-1)
      } catch (searchError) {
        console.error(searchError)

        if (!active) return

        setError("No se pudo completar la búsqueda.")
        setOpen(true)
        setSelectedIndex(-1)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }, 350)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [searchTerm])

  const flattenedResults = useMemo(() => {
    return [
      ...results.requests.map((request) => ({
        type: "request",
        id: request.id,
        path: `/dashboard/solicitudes/${request.id}`,
      })),

      ...results.groups.map((group) => ({
        type: "group",
        id: group.id,
        path: "/dashboard/grupos",
      })),

      ...results.materials.map((material) => ({
        type: "material",
        id: material.id,
        path: "/dashboard/materiales",
      })),

      ...results.users.map((profile) => ({
        type: "user",
        id: profile.id,
        path: `/dashboard/usuarios/${encodeURIComponent(profile.id)}`,
      })),
    ]
  }, [results])

  useEffect(() => {
    if (!open || selectedIndex < 0) return

    selectedResultRef.current?.scrollIntoView({
      block: "nearest",
    })
  }, [open, selectedIndex])

  const totalResults = flattenedResults.length
  const cleanTerm = searchTerm.trim()
  const showRecentSearches =
    open && cleanTerm.length === 0 && recentSearches.length > 0

  function saveRecentSearch(term) {
    const cleanSearch = term.trim()

    if (cleanSearch.length < 2) return

    const updatedSearches = [
      cleanSearch,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== cleanSearch.toLowerCase(),
      ),
    ].slice(0, MAX_RECENT_SEARCHES)

    setRecentSearches(updatedSearches)

    try {
      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(updatedSearches),
      )
    } catch (storageError) {
      console.error(
        "No se pudieron guardar las búsquedas recientes:",
        storageError,
      )
    }
  }

  function clearSearch() {
    setSearchTerm("")
    setResults(initialResults)
    setOpen(false)
    setError("")
    setSelectedIndex(-1)
  }

  function handleNavigate(path) {
    saveRecentSearch(searchTerm)
    navigate(path)
    clearSearch()
  }

  function handleRecentSearch(term) {
    setSearchTerm(term)
    setOpen(true)

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  function handleInputKeyDown(event) {
    if (!open && event.key === "ArrowDown") {
      setOpen(true)
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()

      if (totalResults === 0) return

      setSelectedIndex((currentIndex) =>
        currentIndex >= totalResults - 1 ? 0 : currentIndex + 1,
      )

      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()

      if (totalResults === 0) return

      setSelectedIndex((currentIndex) =>
        currentIndex <= 0 ? totalResults - 1 : currentIndex - 1,
      )

      return
    }

    if (event.key === "Enter") {
      if (selectedIndex < 0 || selectedIndex >= totalResults) return

      event.preventDefault()

      const selectedResult = flattenedResults[selectedIndex]

      if (selectedResult?.path) {
        handleNavigate(selectedResult.path)
      }

      return
    }

    if (event.key === "Escape") {
      setOpen(false)
      setSelectedIndex(-1)
      inputRef.current?.blur()
    }
  }

  function getResultIndex(type, id) {
    return flattenedResults.findIndex(
      (result) =>
        result.type === type &&
        String(result.id) === String(id),
    )
  }

  function getResultButtonClass(resultIndex) {
    return `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
      selectedIndex === resultIndex
        ? "bg-blue-50 ring-2 ring-blue-100"
        : "hover:bg-blue-50"
    }`
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Search
        size={19}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        ref={inputRef}
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyDown={handleInputKeyDown}
        onFocus={() => {
          setOpen(true)
        }}
        placeholder="Buscar tutorías, grupos, materiales o estudiantes..."
        aria-label="Buscar en AulaConecta"
        aria-expanded={open}
        aria-controls="global-search-results"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-24 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {loading ? (
          <LoaderCircle
            size={18}
            className="animate-spin text-blue-600"
            aria-label="Buscando"
          />
        ) : searchTerm ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={clearSearch}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        ) : (
          <span className="hidden rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 shadow-sm sm:inline">
            Ctrl K
          </span>
        )}
      </div>

      {open && (
        <section
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          {showRecentSearches ? (
            <div>
              <div className="flex items-center justify-between px-3 pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Búsquedas recientes
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([])
                    localStorage.removeItem(RECENT_SEARCHES_KEY)
                  }}
                  className="text-xs font-semibold text-slate-500 transition hover:text-red-600"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-1">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleRecentSearch(term)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
                  >
                    <Search size={17} className="text-slate-400" />
                    <span className="truncate">{term}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : loading && totalResults === 0 ? (
            <div className="px-4 py-8 text-center">
              <LoaderCircle
                size={30}
                className="mx-auto animate-spin text-blue-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Buscando...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : cleanTerm.length < 2 ? (
            <div className="px-4 py-8 text-center">
              <Search
                size={28}
                className="mx-auto text-slate-400"
              />

              <h2 className="mt-3 font-bold text-slate-900">
                Busca en AulaConecta
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Escribe al menos dos caracteres para encontrar estudiantes,
                materiales, grupos y solicitudes.
              </p>
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
                    Solicitudes ({results.requests.length})
                  </p>

                  {results.requests.map((request) => {
                    const resultIndex = getResultIndex(
                      "request",
                      request.id,
                    )

                    return (
                      <button
                        key={request.id}
                        ref={
                          selectedIndex === resultIndex
                            ? selectedResultRef
                            : null
                        }
                        type="button"
                        onMouseEnter={() =>
                          setSelectedIndex(resultIndex)
                        }
                        onClick={() =>
                          handleNavigate(
                            `/dashboard/solicitudes/${request.id}`,
                          )
                        }
                        className={getResultButtonClass(resultIndex)}
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
                    )
                  })}
                </div>
              )}

              {results.groups.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Grupos ({results.groups.length})
                  </p>

                  {results.groups.map((group) => {
                    const resultIndex = getResultIndex("group", group.id)

                    return (
                      <button
                        key={group.id}
                        ref={
                          selectedIndex === resultIndex
                            ? selectedResultRef
                            : null
                        }
                        type="button"
                        onMouseEnter={() =>
                          setSelectedIndex(resultIndex)
                        }
                        onClick={() =>
                          handleNavigate("/dashboard/grupos")
                        }
                        className={getResultButtonClass(resultIndex)}
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
                    )
                  })}
                </div>
              )}

              {results.materials.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Materiales ({results.materials.length})
                  </p>

                  {results.materials.map((material) => {
                    const resultIndex = getResultIndex(
                      "material",
                      material.id,
                    )

                    return (
                      <button
                        key={material.id}
                        ref={
                          selectedIndex === resultIndex
                            ? selectedResultRef
                            : null
                        }
                        type="button"
                        onMouseEnter={() =>
                          setSelectedIndex(resultIndex)
                        }
                        onClick={() =>
                          handleNavigate("/dashboard/materiales")
                        }
                        className={getResultButtonClass(resultIndex)}
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
                    )
                  })}
                </div>
              )}

              {results.users.length > 0 && (
                <div>
                  <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Estudiantes ({results.users.length})
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

                    const resultIndex = getResultIndex(
                      "user",
                      profile.id,
                    )

                    return (
                      <button
                        key={profile.id}
                        ref={
                          selectedIndex === resultIndex
                            ? selectedResultRef
                            : null
                        }
                        type="button"
                        onMouseEnter={() =>
                          setSelectedIndex(resultIndex)
                        }
                        onClick={() =>
                          handleNavigate(
                            `/dashboard/usuarios/${encodeURIComponent(profile.id)}`,
                          )
                        }
                        className={getResultButtonClass(resultIndex)}
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

              <div className="border-t border-slate-100 px-3 pt-3 text-xs text-slate-400">
                Usa ↑ y ↓ para navegar, Enter para abrir y Esc para cerrar.
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default GlobalSearch