import { useEffect, useRef, useState } from "react"
import { AlertCircle, BookOpen, CheckCircle2, FileText, Save, Sparkles, Trash2, UploadCloud } from "lucide-react"
import { createMaterial, getMaterialSubjects, validateMaterialFile } from "../../services/materialService"

const initialFormData = { subjectId: "", title: "", description: "", materialType: "document", file: null }
const fieldClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
const formatBytes = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : "0 MB"

function MaterialForm({ onCreated }) {
  const [subjects, setSubjects] = useState([])
  const [formData, setFormData] = useState(initialFormData)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    async function loadSubjects() {
      try { setSubjects(await getMaterialSubjects()) }
      catch (error) { console.error(error); setMessage("No se pudieron cargar las materias."); setMessageType("error") }
      finally { setLoadingSubjects(false) }
    }
    loadSubjects()
  }, [])

  function handleChange({ target: { name, value } }) { setFormData((current) => ({ ...current, [name]: value })) }
  function setFile(file) {
    try { if (file) validateMaterialFile(file); setFormData((current) => ({ ...current, file })); setMessage(""); setMessageType("") }
    catch (error) { if (inputRef.current) inputRef.current.value = ""; setFormData((current) => ({ ...current, file: null })); setMessage(error.message); setMessageType("error") }
  }
  function handleFileChange(event) { setFile(event.target.files?.[0] ?? null) }
  function handleDrop(event) { event.preventDefault(); setFile(event.dataTransfer.files?.[0] ?? null) }
  function removeFile() { if (inputRef.current) inputRef.current.value = ""; setFormData((current) => ({ ...current, file: null })) }

  async function handleSubmit(event) {
    event.preventDefault(); setMessage(""); setMessageType("")
    if (!formData.subjectId || !formData.title.trim() || !formData.description.trim() || !formData.materialType || !formData.file) { setMessage("Completa todos los campos y selecciona un archivo."); setMessageType("error"); return }
    setSubmitting(true)
    try { const material = await createMaterial(formData); setMessage("Material publicado correctamente."); setMessageType("success"); setFormData(initialFormData); if (inputRef.current) inputRef.current.value = ""; onCreated?.(material) }
    catch (error) { console.error(error); setMessage(error.message || "No se pudo publicar el material."); setMessageType("error") }
    finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white sm:p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Sparkles size={14} /> Nuevo material</div>
        <h2 className="text-2xl font-black">Comparte conocimiento con tu comunidad</h2>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100">Sube un archivo útil, agrega una descripción clara y asígnalo a la materia correcta.</p>
      </div>
      <div className="p-6 sm:p-8">
        {message && <div role="alert" className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{messageType === "success" ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}<span>{message}</span></div>}
        <div className="grid gap-5 md:grid-cols-2">
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Materia *</span><div className="relative"><BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select name="subjectId" value={formData.subjectId} onChange={handleChange} disabled={loadingSubjects} className={`${fieldClass} pl-11`}><option value="">{loadingSubjects ? "Cargando materias..." : "Selecciona una materia"}</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div></label>
          <label><span className="mb-2 block text-sm font-bold text-slate-700">Tipo de material *</span><div className="relative"><FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select name="materialType" value={formData.materialType} onChange={handleChange} className={`${fieldClass} pl-11`}><option value="document">Documento</option><option value="presentation">Presentación</option><option value="guide">Guía</option><option value="exercise">Ejercicio</option><option value="image">Imagen</option></select></div></label>
          <label className="md:col-span-2"><span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>Título *</span><span className="text-xs font-medium text-slate-400">{formData.title.length}/150</span></span><input name="title" value={formData.title} onChange={handleChange} maxLength={150} placeholder="Ejemplo: Guía de normalización hasta 3FN" className={fieldClass} /></label>
          <label className="md:col-span-2"><span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>Descripción *</span><span className="text-xs font-medium text-slate-400">{formData.description.length}/1000</span></span><textarea name="description" value={formData.description} onChange={handleChange} rows={5} maxLength={1000} placeholder="Explica qué contiene el archivo y cómo puede ayudar a otros estudiantes." className={`${fieldClass} resize-none`} /></label>
          <div className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-700">Archivo *</span>
            {!formData.file ? (
              <label htmlFor="materialFile" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><UploadCloud size={28} /></span>
                <span className="mt-4 font-bold text-slate-900">Haz clic o arrastra un archivo aquí</span>
                <span className="mt-2 text-sm text-slate-500">PDF, Word, PowerPoint, JPG o PNG. Máximo 6 MB.</span>
              </label>
            ) : (
              <div className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm"><FileText size={24} /></span><div className="min-w-0"><p className="truncate font-bold text-slate-900">{formData.file.name}</p><p className="mt-1 text-xs text-slate-500">{formatBytes(formData.file.size)} · listo para subir</p></div></div>
                <button type="button" onClick={removeFile} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"><Trash2 size={16} /> Quitar</button>
              </div>
            )}
            <input ref={inputRef} id="materialFile" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" className="hidden" />
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">El material quedará sujeto al flujo de revisión existente.</p><button type="submit" disabled={submitting || loadingSubjects} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={18} />{submitting ? "Subiendo material..." : "Publicar material"}</button></div>
      </div>
    </form>
  )
}

export default MaterialForm
