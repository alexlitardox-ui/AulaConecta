import { useEffect, useMemo, useState } from "react"
import { BookOpen, Download, FileText, Heart, Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react"
import { Link } from "react-router-dom"
import MaterialCard from "../../components/Materials/MaterialCard"
import {
  addMaterialFavorite,
  getFavoriteMaterialIds,
  getMaterialDownloadUrl,
  getMaterials,
  removeMaterialFavorite,
} from "../../services/materialService"

import ModuleTabs from "../../components/Navigation/ModuleTabs"
import { materialTabs } from "../../components/Navigation/moduleTabsConfig"

function MaterialsList() {
  const [materials, setMaterials] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [favoriteFilter, setFavoriteFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [favoritingId, setFavoritingId] = useState(null)
  const [message, setMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function loadMaterials() {
    setLoading(true)
    setMessage("")
    try {
      const [materialsData, favoritesData] = await Promise.all([
        getMaterials(),
        getFavoriteMaterialIds(),
      ])
      setMaterials(materialsData)
      setFavoriteIds(favoritesData)
    } catch (error) {
      console.error(error)
      setMessage(
        error?.message?.includes("material_favorites")
          ? "Ejecuta primero el archivo SQL de favoritos en Supabase."
          : "No se pudieron cargar los materiales.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
  }, [])

  async function handleDownload(material) {
    setDownloadingId(material.id)
    setMessage("")
    try {
      const signedUrl = await getMaterialDownloadUrl(material.file_path, material.id)
      window.location.assign(signedUrl)
    } catch (error) {
      console.error(error)
      setMessage("No se pudo descargar el archivo.")
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleToggleFavorite(material) {
    const wasFavorite = favoriteIds.has(material.id)
    setFavoritingId(material.id)
    setMessage("")
    setSuccessMessage("")

    try {
      if (wasFavorite) {
        await removeMaterialFavorite(material.id)
      } else {
        await addMaterialFavorite(material.id)
      }

      setFavoriteIds((current) => {
        const next = new Set(current)
        if (wasFavorite) next.delete(material.id)
        else next.add(material.id)
        return next
      })
      setSuccessMessage(
        wasFavorite
          ? "Material eliminado de tus favoritos."
          : "Material guardado en tus favoritos.",
      )
    } catch (error) {
      console.error(error)
      setMessage("No se pudo actualizar el favorito.")
    } finally {
      setFavoritingId(null)
    }
  }

  const subjects = useMemo(
    () =>
      Array.from(
        new Map(
          materials
            .filter((material) => material.subject)
            .map((material) => [material.subject.id, material.subject]),
        ).values(),
      ),
    [materials],
  )

  const totalDownloads = materials.reduce(
    (sum, item) => sum + (item.download_count || 0),
    0,
  )
  const typesCount = new Set(materials.map((item) => item.material_type)).size

  const filteredMaterials = useMemo(() => {
    const text = searchTerm.trim().toLowerCase()

    return [...materials]
      .filter((material) => {
        const searchableText = [
          material.title,
          material.description,
          material.subject?.name,
          material.subject?.code,
          material.author?.first_name,
          material.author?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        const matchesText = !text || searchableText.includes(text)
        const matchesType =
          typeFilter === "all" || material.material_type === typeFilter
        const matchesSubject =
          subjectFilter === "all" ||
          String(material.subject?.id) === subjectFilter
        const matchesFavorite =
          favoriteFilter === "all" || favoriteIds.has(material.id)

        return matchesText && matchesType && matchesSubject && matchesFavorite
      })
      .sort((a, b) =>
        sortBy === "downloads"
          ? (b.download_count || 0) - (a.download_count || 0)
          : new Date(b.created_at) - new Date(a.created_at),
      )
  }, [
    materials,
    searchTerm,
    typeFilter,
    subjectFilter,
    favoriteFilter,
    favoriteIds,
    sortBy,
  ])

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <ModuleTabs label="Navegación de materiales" items={materialTabs} />
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-7 text-white shadow-xl sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Biblioteca académica</p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">Materiales para aprender y compartir</h1>
              <p className="mt-3 max-w-xl leading-7 text-blue-100">Encuentra recursos de la comunidad y guarda tus favoritos para volver a ellos cuando los necesites.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/dashboard/materiales/favoritos" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center font-bold backdrop-blur transition hover:bg-white/20"><Heart size={18} />Mis favoritos</Link>
              <Link to="/dashboard/materiales/mios" className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center font-bold backdrop-blur transition hover:bg-white/20">Mis materiales</Link>
              <Link to="/dashboard/materiales/nuevo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-700 transition hover:bg-cyan-50"><Plus size={19} />Compartir material</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [FileText, materials.length, "Materiales publicados"],
            [BookOpen, subjects.length, "Materias disponibles"],
            [Download, totalDownloads, "Descargas registradas"],
            [Heart, favoriteIds.size, "Favoritos guardados"],
          ].map(([Icon, value, label]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div><div><p className="text-2xl font-black text-slate-900">{value}</p><p className="text-sm text-slate-500">{label}</p></div></div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><SlidersHorizontal size={17} />Filtros de biblioteca</div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
            <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar título, materia o autor..." className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"><option value="all">Todos los tipos</option><option value="document">Documentos</option><option value="presentation">Presentaciones</option><option value="guide">Guías</option><option value="exercise">Ejercicios</option><option value="image">Imágenes</option></select>
            <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"><option value="all">Todas las materias</option>{subjects.map((subject) => <option key={subject.id} value={String(subject.id)}>{subject.name}</option>)}</select>
            <select value={favoriteFilter} onChange={(event) => setFavoriteFilter(event.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"><option value="all">Todos los materiales</option><option value="favorites">Solo favoritos</option></select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"><option value="newest">Más recientes</option><option value="downloads">Más descargados</option></select>
            <button type="button" onClick={loadMaterials} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={18} />Actualizar</button>
          </div>
        </div>

        {message && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{message}</div>}
        {successMessage && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">{successMessage}</div>}

        {loading ? (
          <div className="mt-10 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" /><p className="mt-4 text-slate-600">Cargando materiales...</p></div>
        ) : filteredMaterials.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><Heart className="mx-auto text-slate-300" size={38} /><h2 className="mt-4 text-xl font-bold text-slate-900">No se encontraron materiales</h2><p className="mt-3 text-slate-500">Prueba con otros filtros o guarda recursos con el botón del corazón.</p></div>
        ) : (
          <>
            <div className="mt-7 flex items-center justify-between"><p className="font-semibold text-slate-700">{filteredMaterials.length} resultado{filteredMaterials.length === 1 ? "" : "s"}</p><p className="text-sm text-slate-400">{typesCount} tipos de recurso</p></div>
            <div className="mt-4 grid gap-6 xl:grid-cols-2">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onDownload={handleDownload}
                  downloading={downloadingId === material.id}
                  isFavorite={favoriteIds.has(material.id)}
                  onToggleFavorite={handleToggleFavorite}
                  favoriting={favoritingId === material.id}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default MaterialsList