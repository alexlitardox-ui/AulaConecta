import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LoaderCircle,
  LogIn,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react"
import { Link } from "react-router-dom"
import { supabase } from "../../services/supabase"
import { CONFIRMATION_STATUS as STATUS, friendlyAuthError, readAuthError } from "../../utils/authConfirmation"

export default function AccountConfirmed() {
  const [status, setStatus] = useState(STATUS.VERIFYING)
  const [message, setMessage] = useState(
    "Estamos comprobando la confirmación de tu correo.",
  )

  useEffect(() => {
    let mounted = true

    async function verifyConfirmation() {
      const authError = readAuthError()

      if (authError.code || authError.description) {
        const result = friendlyAuthError(authError.code, authError.description)
        if (mounted) {
          setStatus(result.status)
          setMessage(result.message)
        }
        return
      }

      try {
        const query = new URLSearchParams(window.location.search)
        const code = query.get("code")

        // En flujos PKCE Supabase devuelve un código que debe intercambiarse
        // por una sesión. En el flujo implícito, el cliente procesa el hash.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        // Supabase puede tardar un instante en persistir la sesión recibida
        // desde el fragmento URL. Hacemos un reintento breve y controlado.
        let sessionResult = await supabase.auth.getSession()

        if (!sessionResult.data.session) {
          await new Promise((resolve) => setTimeout(resolve, 650))
          sessionResult = await supabase.auth.getSession()
        }

        if (sessionResult.error) throw sessionResult.error

        const user = sessionResult.data.session?.user
        const confirmedAt = user?.email_confirmed_at || user?.confirmed_at

        if (!user || !confirmedAt) {
          if (mounted) {
            setStatus(STATUS.ERROR)
            setMessage(
              "No pudimos comprobar la confirmación. El enlace puede haber sido abierto en otro navegador o ya se utilizó.",
            )
          }
          return
        }

        // Retira los tokens del enlace para que no permanezcan visibles ni se
        // copien accidentalmente al compartir la URL.
        window.history.replaceState({}, document.title, "/cuenta-confirmada")

        if (mounted) {
          setStatus(STATUS.SUCCESS)
          setMessage(
            "Tu correo fue confirmado correctamente. Tu cuenta está lista y ya puedes iniciar sesión en AulaConecta.",
          )
        }
      } catch (error) {
        const result = friendlyAuthError(error?.code, error?.message)
        if (mounted) {
          setStatus(result.status)
          setMessage(result.message)
        }
      }
    }

    verifyConfirmation()

    return () => {
      mounted = false
    }
  }, [])

  const isVerifying = status === STATUS.VERIFYING
  const isSuccess = status === STATUS.SUCCESS
  const isExpired = status === STATUS.EXPIRED

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-12 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-900/20" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-900/20" />

      <section className="relative w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-12">
        <Link
          to="/"
          className="mx-auto mb-8 flex w-fit items-center gap-2 text-sm font-black text-slate-700 transition hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-300"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
            <GraduationCap size={22} />
          </span>
          AulaConecta
        </Link>

        <span
          className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl ${
            isVerifying
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : isSuccess
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : isExpired
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {isVerifying ? (
            <LoaderCircle className="animate-spin" size={42} />
          ) : isSuccess ? (
            <CheckCircle2 size={42} />
          ) : isExpired ? (
            <Clock3 size={42} />
          ) : (
            <AlertTriangle size={42} />
          )}
        </span>

        <p
          className={`mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${
            isVerifying
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : isSuccess
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          <ShieldCheck size={14} />
          {isVerifying
            ? "Verificando enlace"
            : isSuccess
              ? "Verificación completada"
              : "Verificación no completada"}
        </p>

        <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">
          {isVerifying
            ? "Confirmando tu cuenta"
            : isSuccess
              ? "¡Cuenta verificada!"
              : isExpired
                ? "El enlace ya no es válido"
                : "No se pudo verificar la cuenta"}
        </h1>

        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600 dark:text-slate-300">
          {message}
        </p>

        {!isVerifying && (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {isSuccess ? (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 dark:shadow-none"
              >
                <LogIn size={18} /> Iniciar sesión
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                <RefreshCcw size={18} /> Solicitar otro enlace
              </Link>
            )}

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Volver al inicio
            </Link>
          </div>
        )}

        <p className="mt-8 text-xs leading-5 text-slate-400 dark:text-slate-500">
          AulaConecta utiliza Supabase Auth para validar el enlace y proteger el acceso a tu cuenta.
        </p>
      </section>
    </main>
  )
}
