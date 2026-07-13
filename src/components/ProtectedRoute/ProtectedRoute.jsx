import { useEffect, useState } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Navigate } from "react-router-dom"
import { supabase } from "../../services/supabase"

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function getSession() {
      setLoading(true)
      setError("")

      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (isMounted) setSession(currentSession)
      } catch (sessionError) {
        console.error("No se pudo verificar la sesión:", sessionError)
        if (isMounted) setError("No se pudo verificar tu sesión. Revisa tu conexión e inténtalo nuevamente.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return
      setSession(currentSession)
      setError("")
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [retryKey])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
          <p className="mt-4 font-medium text-slate-600 dark:text-slate-300">Verificando sesión...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-slate-950">
        <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <AlertCircle className="mx-auto text-amber-500" size={42} />
          <h1 className="mt-5 text-xl font-black text-slate-950 dark:text-white">No pudimos comprobar tu sesión</h1>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{error}</p>
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

  return children
}

export default ProtectedRoute
