import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
  XCircle,
} from "lucide-react"
import { supabase } from "../../services/supabase"

const benefits = [
  {
    icon: UsersRound,
    title: "Aprende en comunidad",
    description: "Conecta con estudiantes y tutores de tu universidad.",
  },
  {
    icon: BookOpenCheck,
    title: "Recursos académicos",
    description: "Encuentra materiales, grupos y apoyo para tus materias.",
  },
  {
    icon: MessageCircleMore,
    title: "Comunicación directa",
    description: "Coordina tutorías y conversaciones desde un solo lugar.",
  },
]

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("error")
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryLoading, setRecoveryLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))

    if (message) {
      setMessage("")
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage("")
    setMessageType("error")

    const email = formData.email.trim()
    const password = formData.password

    if (!email || !password) {
      setMessage("Completa el correo y la contraseña para continuar.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      const translatedMessage =
        error.message === "Invalid login credentials"
          ? "El correo o la contraseña no son correctos. Revisa los datos e inténtalo nuevamente."
          : error.message === "Email not confirmed"
            ? "Primero debes confirmar tu correo electrónico. Revisa tu bandeja de entrada."
            : error.message

      setMessage(translatedMessage)
      setLoading(false)
      return
    }

    navigate("/dashboard")
  }

  function openRecovery() {
    setRecoveryEmail(formData.email.trim())
    setShowRecovery(true)
    setMessage("")
  }

  async function handleRecovery(event) {
    event.preventDefault()

    const email = recoveryEmail.trim()

    if (!email) {
      setMessage("Escribe el correo asociado a tu cuenta.")
      setMessageType("error")
      return
    }

    setRecoveryLoading(true)
    setMessage("")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/configuracion`,
    })

    if (error) {
      setMessage(error.message)
      setMessageType("error")
      setRecoveryLoading(false)
      return
    }

    setMessage(
      "Te enviamos un enlace de recuperación. Revisa tu correo y la carpeta de spam.",
    )
    setMessageType("success")
    setRecoveryLoading(false)
    setShowRecovery(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%)]" />

        <Link
          to="/"
          className="relative z-10 flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur transition hover:bg-white/15"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-blue-700 shadow-lg shadow-blue-950/20">
            <GraduationCap size={25} />
          </span>
          <span>
            <strong className="block text-lg leading-none">AulaConecta</strong>
            <span className="mt-1 block text-xs text-blue-100">
              Comunidad académica
            </span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
            <Sparkles size={16} />
            Tu espacio para aprender y compartir
          </div>

          <h1 className="text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">
            Todo tu mundo académico, en un mismo lugar.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
            Encuentra tutorías, comparte materiales, participa en grupos de
            estudio y avanza junto a tu comunidad universitaria.
          </p>

          <div className="mt-10 grid gap-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icon size={21} />
                </span>
                <div>
                  <h2 className="font-bold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-blue-100">
          <ShieldCheck size={18} />
          Tus datos y sesiones están protegidos mediante Supabase Auth.
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />

        <div className="relative w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-700 lg:hidden"
          >
            <ArrowLeft size={17} />
            Volver al inicio
          </Link>

          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
                <GraduationCap size={27} />
              </span>
              <div>
                <p className="text-xl font-black text-slate-950">AulaConecta</p>
                <p className="text-xs font-medium text-slate-500">
                  Comunidad académica
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                <LockKeyhole size={14} />
                Acceso seguro
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Bienvenido de vuelta
              </h1>
              <p className="mt-3 leading-7 text-slate-600">
                Ingresa tus credenciales para continuar en AulaConecta.
              </p>
            </div>

            {message && (
              <div
                role="alert"
                className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6 ${
                  messageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {messageType === "success" ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                ) : (
                  <XCircle className="mt-0.5 shrink-0" size={18} />
                )}
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    placeholder="nombre@correo.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-slate-700"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={openRecovery}
                    className="text-xs font-bold text-blue-700 transition hover:text-blue-800"
                  >
                    ¿La olvidaste?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading && <LoaderCircle className="animate-spin" size={19} />}
                {loading ? "Verificando acceso..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Primera vez aquí
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              to="/registro"
              className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Crear una cuenta nueva
            </Link>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Al acceder, aceptas usar AulaConecta de forma responsable y dentro
            de su finalidad académica.
          </p>
        </div>
      </section>

      {showRecovery && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-5 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRecovery(false)
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-title"
            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <KeyRound size={24} />
              </span>
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                aria-label="Cerrar recuperación de contraseña"
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="recovery-title"
              className="mt-5 text-2xl font-black text-slate-950"
            >
              Recuperar contraseña
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Enviaremos un enlace seguro al correo asociado con tu cuenta.
            </p>

            <form onSubmit={handleRecovery} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="recoveryEmail"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Correo de recuperación
                </label>
                <div className="relative">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="recoveryEmail"
                    type="email"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                    placeholder="nombre@correo.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {recoveryLoading && (
                    <LoaderCircle className="animate-spin" size={18} />
                  )}
                  {recoveryLoading ? "Enviando..." : "Enviar enlace"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default Login
