import ReportButton from "../Reports/ReportButton"

import {
  BookOpen,
  CalendarDays,
  Download,
  File,
  FileImage,
  FileText,
  Heart,
  Presentation,
  Trash2,
  User,
} from "lucide-react"

const materialLabels = {
  document: "Documento",
  presentation: "Presentación",
  guide: "Guía",
  exercise: "Ejercicio",
  image: "Imagen",
  link: "Enlace",
}

const iconMap = {
  presentation: Presentation,
  image: FileImage,
  guide: BookOpen,
  exercise: FileText,
  document: FileText,
}

function formatFileSize(bytes) {
  if (!bytes) return "Tamaño no disponible"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date) {
  if (!date) return "Fecha no disponible"
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

function MaterialCard({
  material,
  onDownload,
  onDelete,
  downloading = false,
  deleting = false,
  showDelete = false,
  isFavorite = false,
  onToggleFavorite,
  favoriting = false,
}) {
  const authorName = material.author
    ? `${material.author.first_name || ""} ${material.author.last_name || ""}`.trim()
    : "Estudiante"
  const Icon = iconMap[material.material_type] || File

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500" />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
            <Icon size={27} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ReportButton entityType="material" entityId={material.id} compact />
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(material)}
                disabled={favoriting}
                aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isFavorite
                    ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                }`}
              >
                <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {materialLabels[material.material_type] || material.material_type}
            </span>
            {material.review_status && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                material.review_status === "approved"
                  ? "bg-emerald-50 text-emerald-700"
                  : material.review_status === "rejected"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
              }`}>
                {material.review_status === "approved"
                  ? "Aprobado"
                  : material.review_status === "rejected"
                    ? "Rechazado"
                    : "En revisión"}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            {material.subject?.code || "Recurso académico"}
          </p>
          <h2 className="mt-2 line-clamp-2 text-xl font-bold text-slate-900">
            {material.title}
          </h2>
          <p className="mt-3 line-clamp-3 min-h-[78px] leading-7 text-slate-600">
            {material.description || "Sin descripción disponible."}
          </p>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <BookOpen size={17} className="text-blue-600" />
            <span className="truncate">{material.subject?.name || "Materia"}</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={17} className="text-blue-600" />
            <span className="truncate">{authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Download size={17} className="text-blue-600" />
            <span>{material.download_count || 0} descargas</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-blue-600" />
            <span>{formatDate(material.created_at)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="truncate text-sm font-semibold text-slate-700">
            {material.original_file_name || "Archivo adjunto"}
          </p>
          <p className="mt-1 text-xs text-slate-400">{formatFileSize(material.file_size)}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onDownload(material)}
            disabled={downloading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={18} />
            {downloading ? "Preparando..." : "Descargar"}
          </button>

          {showDelete && (
            <button
              type="button"
              onClick={() => onDelete(material)}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 size={18} />
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default MaterialCard
