import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BookOpen, CalendarDays, CheckCircle2, Clock3, Lock, MapPin, Save, Sparkles, Users, Video } from "lucide-react"
import { createStudyGroup, getGroupSubjects } from "../../services/groupService"

const initialFormData = { subjectId: "", name: "", description: "", meetingDate: "", startTime: "", endTime: "", modality: "virtual", locationOrLink: "", maxMembers: "10", accessType: "public" }
const fieldClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"

function GroupForm({ onCreated }) {
  const [subjects, setSubjects] = useState([])
  const [formData, setFormData] = useState(initialFormData)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  useEffect(() => {
    async function loadSubjects() {
      try { setSubjects(await getGroupSubjects()) }
      catch (error) { console.error(error); setMessage("No se pudieron cargar las materias."); setMessageType("error") }
      finally { setLoadingSubjects(false) }
    }
    loadSubjects()
  }, [])

  function handleChange({ target: { name, value } }) { setFormData((current) => ({ ...current, [name]: value })) }

  async function handleSubmit(event) {
    event.preventDefault(); setMessage(""); setMessageType("")
    if (!formData.subjectId || !formData.name.trim() || !formData.description.trim() || !formData.meetingDate || !formData.startTime || !formData.endTime || !formData.maxMembers) { setMessage("Completa todos los campos obligatorios."); setMessageType("error"); return }
    if (formData.meetingDate < today) { setMessage("La fecha no puede estar en el pasado."); setMessageType("error"); return }
    if (formData.endTime <= formData.startTime) { setMessage("La hora final debe ser posterior a la hora de inicio."); setMessageType("error"); return }
    if (Number(formData.maxMembers) < 2 || Number(formData.maxMembers) > 100) { setMessage("El grupo debe permitir entre 2 y 100 integrantes."); setMessageType("error"); return }
    if (formData.modality === "in_person" && !formData.locationOrLink.trim()) { setMessage("Indica el lugar de reunión."); setMessageType("error"); return }
    setSubmitting(true)
    try { const group = await createStudyGroup(formData); setMessage("Grupo creado correctamente."); setMessageType("success"); setFormData(initialFormData); onCreated?.(group) }
    catch (error) { console.error(error); setMessage(error.message || "No se pudo crear el grupo."); setMessageType("error") }
    finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white sm:p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Sparkles size={14} /> Nuevo grupo</div>
        <h2 className="text-2xl font-black">Crea un espacio para aprender juntos</h2>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100">Define el objetivo, horario, capacidad y forma de acceso del grupo.</p>
      </div>
      <div className="p-6 sm:p-8">
        {message && <div role="alert" className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{messageType === "success" ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}<span>{message}</span></div>}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Materia *</span><div className="relative"><BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select name="subjectId" value={formData.subjectId} onChange={handleChange} disabled={loadingSubjects} className={`${fieldClass} pl-11`}><option value="">{loadingSubjects ? "Cargando materias..." : "Selecciona una materia"}</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div></label>
          <label className="md:col-span-2"><span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>Nombre del grupo *</span><span className="text-xs font-medium text-slate-400">{formData.name.length}/150</span></span><input name="name" value={formData.name} onChange={handleChange} maxLength={150} placeholder="Ejemplo: Repaso de Base de Datos" className={fieldClass} /></label>
          <label className="md:col-span-2"><span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>Descripción *</span><span className="text-xs font-medium text-slate-400">{formData.description.length}/1000</span></span><textarea name="description" value={formData.description} onChange={handleChange} rows={5} maxLength={1000} placeholder="Explica qué estudiarán, cuál es el objetivo y cómo se organizarán." className={`${fieldClass} resize-none`} /></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Fecha *</span><div className="relative"><CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" min={today} name="meetingDate" value={formData.meetingDate} onChange={handleChange} className={`${fieldClass} pl-11`} /></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Modalidad *</span><div className="relative"><Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select name="modality" value={formData.modality} onChange={handleChange} className={`${fieldClass} pl-11`}><option value="virtual">Virtual</option><option value="in_person">Presencial</option></select></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Hora de inicio *</span><div className="relative"><Clock3 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className={`${fieldClass} pl-11`} /></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Hora de finalización *</span><div className="relative"><Clock3 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className={`${fieldClass} pl-11`} /></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Máximo de integrantes *</span><div className="relative"><Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="number" name="maxMembers" min="2" max="100" value={formData.maxMembers} onChange={handleChange} className={`${fieldClass} pl-11`} /></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Tipo de acceso *</span><div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select name="accessType" value={formData.accessType} onChange={handleChange} className={`${fieldClass} pl-11`}><option value="public">Público: ingreso inmediato</option><option value="private">Privado: requiere aprobación</option></select></div></label>
          <label className="md:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">{formData.modality === "virtual" ? "Enlace de reunión" : "Lugar de reunión"}{formData.modality === "in_person" ? " *" : ""}</span><div className="relative"><MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input name="locationOrLink" value={formData.locationOrLink} onChange={handleChange} placeholder={formData.modality === "virtual" ? "Ejemplo: enlace de Google Meet" : "Ejemplo: Biblioteca del campus"} className={`${fieldClass} pl-11`} /></div></label>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Los campos marcados con * son obligatorios.</p><button type="submit" disabled={submitting || loadingSubjects} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={18} />{submitting ? "Creando grupo..." : "Crear grupo"}</button></div>
      </div>
    </form>
  )
}

export default GroupForm
