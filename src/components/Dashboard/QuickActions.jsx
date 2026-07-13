import {
  BookOpen,
  FileUp,
  Plus,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"

const actions = [
  {
    label: "Nueva solicitud",
    description: "Solicita apoyo en una materia.",
    path: "/dashboard/solicitudes/nueva",
    icon: Plus,
  },
  {
    label: "Explorar solicitudes",
    description: "Ayuda a otros estudiantes.",
    path: "/dashboard/solicitudes",
    icon: BookOpen,
  },
  {
    label: "Grupos de estudio",
    description: "Encuentra compañeros para estudiar.",
    path: "/dashboard/grupos",
    icon: Users,
  },
  {
    label: "Compartir material",
    description: "Publica recursos académicos.",
    path: "/dashboard/materiales",
    icon: FileUp,
  },
]

function QuickActions() {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        Acciones rápidas
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Accede a las funciones principales.
      </p>

      <div className="mt-6 space-y-3">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.path}
              to={action.path}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Icon size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  {action.label}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {action.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </article>
  )
}

export default QuickActions