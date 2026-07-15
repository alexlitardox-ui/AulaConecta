import { CheckCircle2, LogIn, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

export default function AccountConfirmed() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 dark:bg-slate-950">
      <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 size={42} />
        </span>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <ShieldCheck size={14} /> Verificación completada
        </p>
        <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">Cuenta verificada</h1>
        <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-slate-300">
          Tu correo fue confirmado correctamente. Ya puedes iniciar sesión y utilizar todas las funciones de AulaConecta.
        </p>
        <Link to="/login" className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 dark:shadow-none">
          <LogIn size={18} /> Ir a iniciar sesión
        </Link>
      </section>
    </main>
  )
}
