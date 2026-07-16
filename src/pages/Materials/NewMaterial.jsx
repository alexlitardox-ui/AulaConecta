import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import MaterialForm from "../../components/Materials/MaterialForm"

import ModuleTabs from "../../components/Navigation/ModuleTabs"
import { materialTabs } from "../../components/Navigation/moduleTabsConfig"

function NewMaterial() {
  const navigate = useNavigate()

  function handleCreated() {
    setTimeout(() => {
      navigate("/dashboard/materiales")
    }, 1200)
  }

  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <ModuleTabs label="Navegación de materiales" items={materialTabs} />
        <Link
          to="/dashboard/materiales"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Volver a materiales
        </Link>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Recursos académicos
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Compartir material
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Comparte documentos y recursos que puedan ayudar a otros
              estudiantes.
            </p>

            <div className="mt-8">
              <MaterialForm onCreated={handleCreated} />
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <ShieldCheck size={24} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Antes de publicar
            </h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• No compartas documentos con información personal.</li>
              <li>• Publica únicamente contenido académico.</li>
              <li>• Evita materiales protegidos sin autorización.</li>
              <li>• Utiliza títulos y descripciones claras.</li>
              <li>• Verifica el archivo antes de subirlo.</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default NewMaterial