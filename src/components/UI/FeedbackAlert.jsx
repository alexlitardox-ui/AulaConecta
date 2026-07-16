import { AlertCircle, CheckCircle2, Info } from "lucide-react"

const tones = {
  success: { icon: CheckCircle2, classes: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  error: { icon: AlertCircle, classes: "border-red-200 bg-red-50 text-red-800" },
  info: { icon: Info, classes: "border-blue-200 bg-blue-50 text-blue-800" },
}

export default function FeedbackAlert({ type = "info", children, className = "" }) {
  const tone = tones[type] || tones.info
  const Icon = tone.icon
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${tone.classes} ${className}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="text-sm font-semibold leading-6">{children}</div>
    </div>
  )
}
