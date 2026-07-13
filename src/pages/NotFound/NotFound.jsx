import { ArrowLeft, Home, SearchX } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <SearchX size={31} />
        </span>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-blue-600">Error 404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Esta página no existe
        </h1>
        <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
          Es posible que el enlace esté incompleto o que la sección haya cambiado de dirección.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            <Home size={18} />
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}

export default NotFound
