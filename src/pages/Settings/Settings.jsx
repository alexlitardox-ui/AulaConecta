import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react"

import { supabase } from "../../services/supabase"

const passwordRules = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    validate: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula",
    validate: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Una letra minúscula",
    validate: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Un número",
    validate: (value) => /[0-9]/.test(value),
  },
]

function formatDate(value, includeTime = false) {
  if (!value) return "No disponible"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "No disponible"

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date)
}

function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        setMessage("No se pudo cargar la información de la cuenta.")
        setMessageType("error")
      } else {
        setUser(currentUser)
      }

      setLoading(false)
    }

    loadUser()
  }, [])

  const ruleResults = useMemo(
    () =>
      passwordRules.map((rule) => ({
        ...rule,
        passed: rule.validate(formData.newPassword),
      })),
    [formData.newPassword],
  )

  const passedRules = ruleResults.filter((rule) => rule.passed).length
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.newPassword === formData.confirmPassword

  const passwordStrength = useMemo(() => {
    if (!formData.newPassword) {
      return { label: "Sin evaluar", percentage: 0, tone: "bg-slate-200" }
    }

    if (passedRules <= 1) {
      return { label: "Débil", percentage: 25, tone: "bg-red-500" }
    }

    if (passedRules === 2) {
      return { label: "Regular", percentage: 50, tone: "bg-amber-500" }
    }

    if (passedRules === 3) {
      return { label: "Buena", percentage: 75, tone: "bg-blue-500" }
    }

    return { label: "Fuerte", percentage: 100, tone: "bg-emerald-500" }
  }, [formData.newPassword, passedRules])

  const accountProvider = user?.app_metadata?.provider || "email"
  const emailConfirmed = Boolean(user?.email_confirmed_at)
  const securityScore = emailConfirmed ? 80 : 55

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage("")
    setMessageType("")

    if (!formData.newPassword || !formData.confirmPassword) {
      setMessage("Completa los dos campos de contraseña.")
      setMessageType("error")
      return
    }

    if (passedRules !== passwordRules.length) {
      setMessage("La contraseña todavía no cumple todos los requisitos.")
      setMessageType("error")
      return
    }

    if (!passwordsMatch) {
      setMessage("Las contraseñas no coinciden.")
      setMessageType("error")
      return
    }

    setSaving(true)

    const { error } = await supabase.auth.updateUser({
      password: formData.newPassword,
    })

    if (error) {
      console.error(error)
      setMessage(error.message || "No se pudo actualizar la contraseña.")
      setMessageType("error")
      setSaving(false)
      return
    }

    setFormData({ newPassword: "", confirmPassword: "" })
    setMessage("Contraseña actualizada correctamente.")
    setMessageType("success")
    setSaving(false)
  }

  async function handleGlobalSignOut() {
    const confirmed = window.confirm(
      "¿Deseas cerrar tu sesión en todos los dispositivos? Tendrás que volver a iniciar sesión.",
    )

    if (!confirmed) return

    setSigningOut(true)
    setMessage("")

    const { error } = await supabase.auth.signOut({ scope: "global" })

    if (error) {
      setMessage(error.message || "No se pudieron cerrar las sesiones.")
      setMessageType("error")
      setSigningOut(false)
      return
    }

    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
          <p className="mt-4 font-medium text-slate-600">
            Cargando configuración...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-7">
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                <ShieldCheck size={15} /> Centro de seguridad
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                Configuración de tu cuenta
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Revisa la información de acceso y fortalece la protección de tu cuenta de AulaConecta.
              </p>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Seguridad de la cuenta
                  </p>
                  <p className="mt-1 text-2xl font-black">{securityScore}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                  <Shield size={25} />
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${securityScore}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-300">
                {emailConfirmed
                  ? "Tu correo está verificado. Mantén una contraseña única y segura."
                  : "Verifica tu correo para mejorar la protección de tu cuenta."}
              </p>
            </div>
          </div>
        </header>

        {message && (
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            ) : (
              <AlertCircle className="mt-0.5 shrink-0" size={20} />
            )}
            <p className="text-sm font-semibold">{message}</p>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <div className="space-y-6">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <UserRound size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Cuenta
                  </p>
                  <h2 className="text-lg font-black text-slate-900">
                    Información de acceso
                  </h2>
                </div>
              </div>

              <dl className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Mail size={15} /> Correo electrónico
                  </dt>
                  <dd className="mt-2 break-all text-sm font-bold text-slate-900">
                    {user?.email || "No disponible"}
                  </dd>
                  <span
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      emailConfirmed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {emailConfirmed ? <Check size={14} /> : <Clock3 size={14} />}
                    {emailConfirmed ? "Correo verificado" : "Verificación pendiente"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <CalendarDays size={15} /> Cuenta creada
                    </dt>
                    <dd className="mt-2 text-sm font-bold text-slate-900">
                      {formatDate(user?.created_at)}
                    </dd>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Clock3 size={15} /> Último acceso
                    </dt>
                    <dd className="mt-2 text-sm font-bold text-slate-900">
                      {formatDate(user?.last_sign_in_at, true)}
                    </dd>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Laptop size={15} /> Método de acceso
                  </dt>
                  <dd className="mt-2 text-sm font-bold capitalize text-slate-900">
                    {accountProvider === "email" ? "Correo y contraseña" : accountProvider}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Sparkles size={22} />
              </div>
              <h2 className="mt-4 text-lg font-black text-slate-900">
                Buenas prácticas
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li className="flex gap-2"><Check className="mt-1 shrink-0 text-blue-600" size={16} /> Usa una contraseña diferente a la de otras plataformas.</li>
                <li className="flex gap-2"><Check className="mt-1 shrink-0 text-blue-600" size={16} /> No compartas códigos o contraseñas por mensajes.</li>
                <li className="flex gap-2"><Check className="mt-1 shrink-0 text-blue-600" size={16} /> Cierra sesión cuando uses un equipo público.</li>
              </ul>
            </article>
          </div>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <KeyRound size={23} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Credenciales
                    </p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">
                      Cambiar contraseña
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Crea una clave difícil de adivinar y que no utilices en otros servicios.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-bold text-slate-700">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Ingresa una nueva contraseña"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-12 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold">
                    <span className="text-slate-500">Fortaleza</span>
                    <span className="text-slate-700">{passwordStrength.label}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${passwordStrength.tone}`}
                      style={{ width: `${passwordStrength.percentage}%` }}
                    />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {ruleResults.map((rule) => (
                      <div
                        key={rule.id}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                          rule.passed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        {rule.passed ? <Check size={15} /> : <X size={15} />}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-slate-700">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Repite la nueva contraseña"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-12 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <p className={`mt-2 flex items-center gap-2 text-xs font-bold ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}>
                      {passwordsMatch ? <Check size={15} /> : <X size={15} />}
                      {passwordsMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? <RefreshCw className="animate-spin" size={19} /> : <Save size={19} />}
                  {saving ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </form>
            </section>

            <section className="rounded-[1.75rem] border border-red-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <LogOut size={23} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                      Sesiones activas
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-900">
                      Cerrar sesión en todos los dispositivos
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      Usa esta opción si iniciaste sesión en un equipo que ya no controlas o sospechas de un acceso no autorizado.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGlobalSignOut}
                  disabled={signingOut}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {signingOut ? <RefreshCw className="animate-spin" size={18} /> : <LogOut size={18} />}
                  {signingOut ? "Cerrando..." : "Cerrar todas"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Settings
