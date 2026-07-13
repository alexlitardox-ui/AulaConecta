import { useLocation } from "react-router-dom"

const pageNames = {
  "/dashboard/perfil": "Mi perfil",
  "/dashboard/tutorias": "Tutorías",
  "/dashboard/solicitudes": "Solicitudes",
  "/dashboard/grupos": "Grupos de estudio",
  "/dashboard/materiales": "Materiales",
  "/dashboard/reputacion": "Mi reputación",
  "/dashboard/notificaciones": "Notificaciones",
  "/dashboard/configuracion": "Configuración",
}

function Placeholder() {
  const location = useLocation()
  const title = pageNames[location.pathname] || "Sección"

  return (
    <main className="px-5 py-8 sm:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          AulaConecta
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-3 text-slate-600">
          Esta sección ya tiene navegación funcional y será desarrollada en el
          siguiente módulo.
        </p>
      </section>
    </main>
  )
}

export default Placeholder