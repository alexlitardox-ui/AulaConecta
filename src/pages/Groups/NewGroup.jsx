import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import GroupForm from "../../components/Groups/GroupForm"

import ModuleTabs from "../../components/Navigation/ModuleTabs"
import { groupTabs } from "../../components/Navigation/moduleTabsConfig"

function NewGroup() {
  const navigate = useNavigate()

  function handleCreated() {
    setTimeout(() => {
      navigate("/dashboard/grupos")
    }, 1200)
  }

  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <ModuleTabs label="Navegación de grupos de estudio" items={groupTabs} />
        <Link
          to="/dashboard/grupos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Volver a grupos
        </Link>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Comunidad académica
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Crear grupo de estudio
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Organiza una reunión académica y conecta con estudiantes que
              desean reforzar la misma materia.
            </p>

            <div className="mt-8">
              <GroupForm onCreated={handleCreated} />
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <ShieldCheck size={24} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Buenas prácticas
            </h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Define claramente los temas que estudiarán.</li>
              <li>• Establece un horario realista.</li>
              <li>• No publiques información personal sensible.</li>
              <li>• Respeta el número máximo de integrantes.</li>
              <li>• Cancela el grupo si la reunión no se realizará.</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default NewGroup