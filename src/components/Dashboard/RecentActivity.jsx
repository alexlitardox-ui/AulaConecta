import { BookOpen } from "lucide-react"
import { Link } from "react-router-dom"

const statusLabels = {
  open: "Abierta",
  with_applications: "Con postulaciones",
  accepted: "Aceptada",
  cancelled: "Cancelada",
  closed: "Cerrada",
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

function RecentActivity({ requests }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Actividad reciente
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tus últimas solicitudes publicadas.
          </p>
        </div>

        <Link
          to="/dashboard/solicitudes/mias"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Ver todas
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="mt-8 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <BookOpen size={26} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Sin actividad reciente
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Cuando publiques una solicitud aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-slate-100">
          {requests.map((request) => (
            <Link
              key={request.id}
              to={`/dashboard/solicitudes/${request.id}`}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BookOpen size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">
                  {request.title}
                </h3>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {request.subject?.name || "Materia"} ·{" "}
                  {formatDate(request.created_at)}
                </p>
              </div>

              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:block">
                {statusLabels[request.status] || request.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}

export default RecentActivity