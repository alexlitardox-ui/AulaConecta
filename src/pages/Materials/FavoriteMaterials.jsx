import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Heart, RefreshCw, Search } from "lucide-react"
import { Link } from "react-router-dom"
import MaterialCard from "../../components/Materials/MaterialCard"
import {
  getFavoriteMaterials,
  getMaterialDownloadUrl,
  removeMaterialFavorite,
} from "../../services/materialService"

function FavoriteMaterials() {
  const [materials, setMaterials] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [favoritingId, setFavoritingId] = useState(null)
  const [message, setMessage] = useState("")

  async function loadFavorites() {
    setLoading(true)
    setMessage("")
    try {
      setMaterials(await getFavoriteMaterials())
    } catch (error) {
      console.error(error)
      setMessage(
        error?.message?.includes("material_favorites")
          ? "Ejecuta primero el archivo SQL de favoritos en Supabase."
          : "No se pudieron cargar tus materiales favoritos.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFavorites()
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

  async function handleRemoveFavorite(material) {
    setFavoritingId(material.id)
    setMessage("")
    try {
      await removeMaterialFavorite(material.id)
      setMaterials((current) =>
        current.filter((item) => item.id !== material.id),
      )
    } catch (error) {
      console.error(error)
      setMessage("No se pudo quitar el material de favoritos.")
    } finally {
      setFavoritingId(null)
    }
  }

  const filteredMaterials = useMemo(() => {
    const text = searchTerm.trim().toLowerCase()
    if (!text) return materials

    return materials.filter((material) =>
      [
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
        .includes(text),
    )
  }, [materials, searchTerm])

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-950 via-slate-950 to-blue-900 p-7 text-white shadow-xl sm:p-9">
          <Link to="/dashboard/materiales" className="inline-flex items-center gap-2 text-sm font-bold text-rose-100 transition hover:text-white"><ArrowLeft size={17} />Volver a la biblioteca</Link>
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-2xl bg-white/10 p-3 text-rose-200"><Heart size={28} fill="currentColor" /></div>
              <h1 className="mt-5 text-3xl font-black sm:text-4xl">Mis materiales favoritos</h1>
              <p className="mt-3 leading-7 text-slate-200">Tu colección personal de guías, documentos y recursos académicos guardados.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 backdrop-blur">
              <p className="text-3xl font-black">{materials.length}</p>
              <p className="text-sm text-slate-300">recursos guardados</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
          <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar dentro de tus favoritos..." className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div>
          <button type="button" onClick={loadFavorites} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"><RefreshCw size={18} />Actualizar</button>
        </div>

        {message && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{message}</div>}

        {loading ? (
          <div className="mt-10 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-rose-600" /><p className="mt-4 text-slate-600">Cargando favoritos...</p></div>
        ) : filteredMaterials.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><Heart className="mx-auto text-slate-300" size={42} /><h2 className="mt-4 text-xl font-bold text-slate-900">{materials.length === 0 ? "Todavía no guardas materiales" : "No hay coincidencias"}</h2><p className="mt-3 text-slate-500">{materials.length === 0 ? "Abre la biblioteca y pulsa el corazón de los recursos que quieras conservar." : "Prueba con otra búsqueda."}</p>{materials.length === 0 && <Link to="/dashboard/materiales" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-blue-600">Explorar biblioteca</Link>}</div>
        ) : (
          <div className="mt-7 grid gap-6 xl:grid-cols-2">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDownload={handleDownload}
                downloading={downloadingId === material.id}
                isFavorite
                onToggleFavorite={handleRemoveFavorite}
                favoriting={favoritingId === material.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default FavoriteMaterials
