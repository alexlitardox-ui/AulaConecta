import { useEffect, useMemo, useState } from "react"
import { Check, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck, XCircle } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"

const rules = [
  { label: "Mínimo 8 caracteres", test: (value) => value.length >= 8 },
  { label: "Una letra mayúscula", test: (value) => /[A-Z]/.test(value) },
  { label: "Una letra minúscula", test: (value) => /[a-z]/.test(value) },
  { label: "Un número", test: (value) => /\d/.test(value) },
]

function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("error")

  useEffect(() => {
    let mounted = true

    async function checkRecoverySession() {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      setValidSession(Boolean(data.session) && !error)
      setReady(true)
    }

    checkRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === "PASSWORD_RECOVERY" || session) setValidSession(true)
      setReady(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const ruleResults = useMemo(
    () => rules.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  )
  const validPassword = ruleResults.every((rule) => rule.passed)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage("")

    if (!validPassword) {
      setMessage("La nueva contraseña todavía no cumple todos los requisitos.")
      setMessageType("error")
      return
    }

    if (!passwordsMatch) {
      setMessage("Las contraseñas no coinciden.")
      setMessageType("error")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(error.message || "No se pudo actualizar la contraseña.")
      setMessageType("error")
      setLoading(false)
      return
    }

    setMessage("Contraseña actualizada. Ya puedes continuar en AulaConecta.")
    setMessageType("success")
    setLoading(false)
    window.setTimeout(() => navigate("/dashboard", { replace: true }), 1200)
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoaderCircle className="animate-spin text-blue-600" size={42} />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <KeyRound size={27} />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Crea una nueva contraseña
        </h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
          Utiliza una contraseña diferente a las que usas en otros servicios.
        </p>

        {!validSession ? (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold">El enlace ya no es válido</p>
                <p className="mt-1 text-sm leading-6">Solicita un nuevo correo de recuperación desde el inicio de sesión.</p>
              </div>
            </div>
            <Link to="/login" className="mt-5 inline-flex rounded-xl bg-amber-900 px-4 py-2.5 font-bold text-white dark:bg-amber-300 dark:text-amber-950">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {message && (
              <div
                role="alert"
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  messageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-500/10"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-500/10"
                required
              />
            </div>

            <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70 sm:grid-cols-2">
              {ruleResults.map((rule) => (
                <div key={rule.label} className={`flex items-center gap-2 text-sm ${rule.passed ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500"}`}>
                  <Check size={16} />
                  {rule.label}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="animate-spin" size={19} /> : <ShieldCheck size={19} />}
              Actualizar contraseña
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default ResetPassword
