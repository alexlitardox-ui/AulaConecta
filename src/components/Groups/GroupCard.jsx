import ReportButton from "../Reports/ReportButton"

import {
  ArrowRight,
  CalendarDays,
  Clock,
  Crown,
  Lock,
  MapPin,
  ShieldCheck,
  User,
  Users,
  Video,
  Trash2,
} from "lucide-react"

function formatDate(date) {
  if (!date) return "Fecha por confirmar"
  return new Intl.DateTimeFormat("es-EC", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  return time?.slice(0, 5) || "--:--"
}

function GroupCard({ group, onJoin, joining = false, showJoinButton = true, onDelete, deleting = false, showDelete = false }) {
  const creatorName = group.creator
    ? `${group.creator.first_name} ${group.creator.last_name}`
    : "Estudiante"
  const progress = Math.min(
    100,
    Math.round(((group.memberCount || 0) / Math.max(group.max_members || 1, 1)) * 100),
  )
  const availableSpots = Math.max((group.max_members || 0) - (group.memberCount || 0), 0)

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {group.subject?.code || "Materia"}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${group.access_type === "private" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {group.access_type === "private" ? "Privado" : "Público"}
              </span>
            </div>
            <h2 className="mt-4 line-clamp-2 text-xl font-black text-slate-900">
              {group.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {group.subject?.name || "Materia por definir"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-700">
            {group.access_type === "private" ? <Lock size={21} /> : <Users size={21} />}
          </div>
        </div>

        <p className="mt-5 line-clamp-3 leading-7 text-slate-600">{group.description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Info icon={CalendarDays} text={formatDate(group.meeting_date)} />
          <Info icon={Clock} text={`${formatTime(group.start_time)} - ${formatTime(group.end_time)}`} />
          <Info icon={Video} text={group.modality === "virtual" ? "Reunión virtual" : "Reunión presencial"} />
          <Info icon={User} text={`Creado por ${creatorName}`} />
        </div>

        {group.location_or_link && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <MapPin size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <span className="break-all">{group.location_or_link}</span>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-700">Integrantes</span>
            <span className="font-black text-slate-900">
              {group.memberCount}/{group.max_members}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {availableSpots > 0 ? `${availableSpots} cupos disponibles` : "Grupo completo"}
          </p>
        </div>

        {!group.isCreator && <div className="mt-4 flex justify-end"><ReportButton entityType="group" entityId={group.id} /></div>}

        {showDelete && group.isCreator && (
          <button
            type="button"
            onClick={() => onDelete?.(group)}
            disabled={deleting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={18} />
            {deleting ? "Eliminando grupo..." : "Eliminar grupo"}
          </button>
        )}

        {group.isCreator ? (
          <StatusBox icon={Crown} className="border-amber-200 bg-amber-50 text-amber-700" text="Este grupo fue creado por ti" />
        ) : group.membershipPending ? (
          <StatusBox icon={ShieldCheck} className="border-amber-200 bg-amber-50 text-amber-700" text="Solicitud de ingreso pendiente" />
        ) : group.isMember ? (
          <StatusBox icon={Users} className="border-emerald-200 bg-emerald-50 text-emerald-700" text="Ya perteneces a este grupo" />
        ) : showJoinButton ? (
          <button
            type="button"
            onClick={() => onJoin(group)}
            disabled={joining || group.status === "full"}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {joining ? "Procesando..." : group.status === "full" ? "Grupo completo" : group.access_type === "private" ? "Solicitar ingreso" : "Unirme al grupo"}
            {!joining && group.status !== "full" && <ArrowRight size={18} />}
          </button>
        ) : null}
      </div>
    </article>
  )
}

function Info({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 text-sm text-slate-600">
      <div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Icon size={17} /></div>
      <span className="line-clamp-2">{text}</span>
    </div>
  )
}

function StatusBox({ icon: Icon, text, className }) {
  return (
    <div className={`mt-5 flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${className}`}>
      <Icon size={18} /> {text}
    </div>
  )
}

export default GroupCard
