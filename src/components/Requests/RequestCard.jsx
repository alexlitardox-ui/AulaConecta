import {
  ArrowRight,
  CalendarDays,
  Clock,
  Laptop,
  MapPin,
  User,
} from "lucide-react"
import { Link } from "react-router-dom"

function formatDate(date) {
  if (!date) return "Fecha por definir"

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  return time?.slice(0, 5) || "--:--"
}

function RequestCard({ request, onApply }) {
  const studentName = request.student
    ? `${request.student.first_name} ${request.student.last_name}`
    : "Estudiante"

  const statusLabel =
    request.status === "with_applications"
      ? "Con postulaciones"
      : "Disponible"

  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-violet-500 opacity-0 transition group-hover:opacity-100" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-100">
            {request.subject?.name || "Materia"}
          </span>

          <h2 className="mt-4 text-xl font-extrabold leading-snug text-slate-900">
            {request.title}
          </h2>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Tema: {request.topic}
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
          {statusLabel}
        </span>
      </div>

      <p className="mt-5 line-clamp-3 leading-7 text-slate-600">
        {request.description}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <InfoItem icon={CalendarDays} text={formatDate(request.requested_date)} />
        <InfoItem
          icon={Clock}
          text={`${formatTime(request.start_time)} - ${formatTime(request.end_time)}`}
        />
        <InfoItem
          icon={Laptop}
          text={request.modality === "virtual" ? "Virtual" : "Presencial"}
        />
        <InfoItem icon={User} text={studentName} />
      </div>

      {request.location_or_link && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <MapPin size={18} className="mt-0.5 shrink-0 text-blue-600" />
          <span className="break-all">{request.location_or_link}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/dashboard/solicitudes/${request.id}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Ver detalles
          <ArrowRight size={17} />
        </Link>

        {request.isOwnRequest ? (
          <div className="inline-flex flex-1 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-bold text-amber-700">
            Publicada por ti
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onApply(request)}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200"
          >
            Postularme como tutor
          </button>
        )}
      </div>
    </article>
  )
}

function InfoItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-600">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
        <Icon size={17} />
      </span>
      <span className="min-w-0 truncate">{text}</span>
    </div>
  )
}

export default RequestCard
