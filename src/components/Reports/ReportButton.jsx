import { useState } from "react"
import { Flag, LoaderCircle } from "lucide-react"
import { createReport } from "../../services/reportService"

const reasons = [
  ["spam", "Spam o publicidad"],
  ["inappropriate", "Contenido inapropiado"],
  ["misleading", "Información engañosa"],
  ["harassment", "Acoso o comportamiento ofensivo"],
  ["copyright", "Posible infracción de autoría"],
  ["other", "Otro motivo"],
]

export default function ReportButton({ entityType, entityId, compact = false }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("spam")
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState("")

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setFeedback("")
    try {
      await createReport({ entityType, entityId, reason, details })
      setFeedback("Reporte enviado. El equipo de moderación lo revisará.")
      setDetails("")
      setTimeout(() => setOpen(false), 1200)
    } catch (error) {
      setFeedback(error.message || "No se pudo enviar el reporte.")
    } finally {
      setLoading(false)
    }
  }

  return <>
    <button type="button" onClick={() => { setOpen(true); setFeedback("") }} className={compact ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700" : "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"} aria-label="Reportar contenido" title="Reportar contenido">
      <Flag size={17}/>{!compact && "Reportar"}
    </button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Moderación</p><h2 id="report-title" className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Reportar contenido</h2><p className="mt-2 text-sm leading-6 text-slate-500">Solo moderadores y administradores podrán revisar este reporte.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Cerrar</button></div>
        <label className="mt-6 block text-sm font-bold text-slate-700 dark:text-slate-200">Motivo<select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950">{reasons.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="mt-4 block text-sm font-bold text-slate-700 dark:text-slate-200">Detalles opcionales<textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={4} placeholder="Describe brevemente el problema..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950"/></label>
        {feedback && <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{feedback}</p>}
        <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 font-black text-white hover:bg-amber-700 disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={18}/> : <Flag size={18}/>} {loading ? "Enviando..." : "Enviar reporte"}</button>
      </form>
    </div>}
  </>
}
