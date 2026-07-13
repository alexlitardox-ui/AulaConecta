import { Plus, Search } from "lucide-react"
import { Link } from "react-router-dom"

function DashboardHeader({ firstName }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-7 text-white shadow-xl shadow-blue-200 sm:p-9">
      <p className="font-medium text-blue-100">
        Bienvenido nuevamente
      </p>

      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        Hola, {firstName} 👋
      </h1>

      <p className="mt-3 max-w-2xl leading-7 text-blue-100">
        Organiza tus solicitudes, encuentra apoyo académico y comparte tus
        conocimientos con la comunidad.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/dashboard/solicitudes/nueva"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50"
        >
          <Plus size={19} />
          Nueva solicitud
        </Link>

        <Link
          to="/dashboard/solicitudes"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
        >
          <Search size={19} />
          Explorar solicitudes
        </Link>
      </div>
    </section>
  )
}

export default DashboardHeader