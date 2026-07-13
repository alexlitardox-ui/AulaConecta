import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Laptop,
  MapPin,
  Save,
  Sparkles,
} from "lucide-react"

import { createTutorRequest, getActiveSubjects } from "../../services/requestService"

const initialFormData = {
  subjectId: "",
  title: "",
  topic: "",
  description: "",
  requestedDate: "",
  startTime: "",
  endTime: "",
  modality: "virtual",
  locationOrLink: "",
}

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"

function RequestForm({ onCreated }) {
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [formData, setFormData] = useState(initialFormData)

  const today = useMemo(() => new Date().toISOString().split("T")[0], [])
  const completedFields = [
    formData.subjectId,
    formData.title.trim(),
    formData.topic.trim(),
    formData.description.trim(),
    formData.requestedDate,
    formData.startTime,
    formData.endTime,
  ].filter(Boolean).length
  const progress = Math.round((completedFields / 7) * 100)

  useEffect(() => {
    async function loadSubjects() {
      try {
        setSubjects(await getActiveSubjects())
      } catch (error) {
        console.error(error)
        setMessage("No se pudieron cargar las materias.")
        setMessageType("error")
      } finally {
        setLoadingSubjects(false)
      }
    }
    loadSubjects()
  }, [])

  function handleChange({ target: { name, value } }) {
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage("")
    setMessageType("")

    if (progress < 100) {
      setMessage("Completa todos los campos obligatorios antes de publicar.")
      setMessageType("error")
      return
    }
    if (formData.requestedDate < today) {
      setMessage("La fecha de la tutoría no puede estar en el pasado.")
      setMessageType("error")
      return
    }
    if (formData.endTime <= formData.startTime) {
      setMessage("La hora final debe ser posterior a la hora de inicio.")
      setMessageType("error")
      return
    }
    if (formData.modality === "in_person" && !formData.locationOrLink.trim()) {
      setMessage("Indica el lugar de la tutoría presencial.")
      setMessageType("error")
      return
    }

    setSubmitting(true)
    try {
      const request = await createTutorRequest(formData)
      setMessage("Solicitud publicada correctamente.")
      setMessageType("success")
      setFormData(initialFormData)
      onCreated?.(request)
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo publicar la solicitud.")
      setMessageType("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles size={14} /> Nueva solicitud
            </div>
            <h2 className="text-2xl font-black">Cuéntanos en qué necesitas ayuda</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">Mientras más clara sea la información, más fácil será encontrar al tutor adecuado.</p>
          </div>
          <div className="min-w-40 rounded-2xl bg-white/15 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs font-semibold"><span>Progreso</span><span>{progress}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {message && (
          <div role="alert" className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {messageType === "success" ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-700">Materia *</span>
            <div className="relative"><BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select name="subjectId" value={formData.subjectId} onChange={handleChange} disabled={loadingSubjects} className={`${fieldClass} pl-11`}><option value="">{loadingSubjects ? "Cargando materias..." : "Selecciona una materia"}</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>Título *</span><span className="text-xs font-medium text-slate-400">{formData.title.length}/120</span></span>
            <input name="title" value={formData.title} onChange={handleChange} maxLength={120} placeholder="Ejemplo: Necesito ayuda para preparar mi examen" className={fieldClass} />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>Tema específico *</span><span className="text-xs font-medium text-slate-400">{formData.topic.length}/120</span></span>
            <input name="topic" value={formData.topic} onChange={handleChange} maxLength={120} placeholder="Ejemplo: Integrales triples y cambio de variables" className={fieldClass} />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>Descripción *</span><span className="text-xs font-medium text-slate-400">{formData.description.length}/1000</span></span>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={5} maxLength={1000} placeholder="Explica qué has intentado, qué parte no entiendes y qué esperas aprender." className={`${fieldClass} resize-none`} />
          </label>

          <label><span className="mb-2 block text-sm font-bold text-slate-700">Fecha *</span><div className="relative"><CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" min={today} name="requestedDate" value={formData.requestedDate} onChange={handleChange} className={`${fieldClass} pl-11`} /></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Modalidad *</span><div className="relative"><Laptop size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select name="modality" value={formData.modality} onChange={handleChange} className={`${fieldClass} pl-11`}><option value="virtual">Virtual</option><option value="in_person">Presencial</option></select></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Hora de inicio *</span><div className="relative"><Clock3 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className={`${fieldClass} pl-11`} /></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Hora de finalización *</span><div className="relative"><Clock3 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className={`${fieldClass} pl-11`} /></div></label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-700">{formData.modality === "virtual" ? "Enlace de reunión" : "Lugar de encuentro"}{formData.modality === "in_person" ? " *" : ""}</span>
            <div className="relative"><MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="locationOrLink" value={formData.locationOrLink} onChange={handleChange} placeholder={formData.modality === "virtual" ? "Puedes añadir el enlace ahora o compartirlo después" : "Ejemplo: Biblioteca central, segundo piso"} className={`${fieldClass} pl-11`} /></div>
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Los campos marcados con * son obligatorios.</p>
          <button type="submit" disabled={submitting || loadingSubjects} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={18} />{submitting ? "Publicando..." : "Publicar solicitud"}</button>
        </div>
      </div>
    </form>
  )
}

export default RequestForm
