import { useEffect, useState } from "react"
import { AlertCircle, Ban, LogOut, RefreshCw } from "lucide-react"
import { Navigate } from "react-router-dom"
import { supabase } from "../../services/supabase"

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null)
  const [accountStatus, setAccountStatus] = useState("active")
  const [suspensionReason, setSuspensionReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadAccountState(currentSession) {
      if (!currentSession?.user) {
        if (isMounted) {
          setSession(null)
          setAccountStatus("active")
          setSuspensionReason("")
        }
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("account_status,suspension_reason")
        .eq("id", currentSession.user.id)
        .maybeSingle()

      if (profileError && profileError.code !== "42703") throw profileError

      if (isMounted) {
        setSession(currentSession)
        setAccountStatus(profile?.account_status ?? "active")
        setSuspensionReason(profile?.suspension_reason ?? "")
      }
    }

    async function getSession() {
      setLoading(true)
      setError("")

      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        await loadAccountState(currentSession)
      } catch (sessionError) {
        console.error("No se pudo verificar la sesión:", sessionError)
        if (isMounted) {
          setError(
            "No se pudo verificar tu sesión. Revisa tu conexión e inténtalo nuevamente.",
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return

      try {
        await loadAccountState(currentSession)
        setError("")
      } catch (stateError) {
        console.error("No se pudo comprobar el estado de la cuenta:", stateError)
        setError("No se pudo comprobar el estado de tu cuenta.")
      } finally {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [retryKey])

  async function signOutSuspendedUser() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
          <p className="mt-4 font-medium text-slate-600 dark:text-slate-300">
            Verificando sesión...
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">
        <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <AlertCircle className="mx-auto text-amber-500" size={42} />
          <h1 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
            No pudimos comprobar tu sesión
          </h1>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
          >
            <RefreshCw size={18} />
            Volver a intentar
          </button>
        </section>
      </main>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (accountStatus === "suspended") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">
        <section className="w-full max-w-lg rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900/60 dark:bg-slate-900">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
            <Ban size={34} />
          </span>
          <h1 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">
            Cuenta suspendida
          </h1>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Tu acceso a AulaConecta fue suspendido por un administrador.
          </p>
          {suspensionReason && (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              <strong>Motivo:</strong> {suspensionReason}
            </div>
          )}
          <button
            type="button"
            onClick={signOutSuspendedUser}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </section>
      </main>
    )
  }

  return children
}

export default ProtectedRoute
