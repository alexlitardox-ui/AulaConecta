import { Check, Clock3, User, X } from "lucide-react"

function formatDate(date) {
  if (!date) return ""
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function PendingMemberCard({ membership, onAccept, onReject, processing = false }) {
  const fullName = membership.profile
    ? `${membership.profile.first_name} ${membership.profile.last_name}`
    : "Estudiante"
  const initials = membership.profile
    ? `${membership.profile.first_name?.charAt(0) || ""}${membership.profile.last_name?.charAt(0) || ""}`.toUpperCase()
    : "ES"

  return (
    <article className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white shadow-sm">
            {membership.profile?.avatar_url ? (
              <img src={membership.profile.avatar_url} alt={fullName} className="h-full w-full object-cover" />
            ) : initials || <User size={20} />}
          </div>
          <div>
            <h3 className="font-black text-slate-900">{fullName}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{membership.group?.name || "Grupo de estudio"}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Clock3 size={14} /> {formatDate(membership.joined_at)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => onAccept(membership)} disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"><Check size={18} /> Aceptar</button>
          <button type="button" onClick={() => onReject(membership)} disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"><X size={18} /> Rechazar</button>
        </div>
      </div>
    </article>
  )
}

export default PendingMemberCard
