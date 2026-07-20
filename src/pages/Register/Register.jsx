import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react"
import { supabase } from "../../services/supabase"
import TurnstileWidget from "../../components/Security/TurnstileWidget"
import { SUPPORT_EMAIL } from "../../config/appConfig"

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"

const passwordRules = [
  {
    label: "Al menos 8 caracteres",
    test: (password) => password.length >= 8,
  },
  {
    label: "Una letra mayúscula",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Una letra minúscula",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "Un número",
    test: (password) => /\d/.test(password),
  },
]

function Register() {
  const navigate = useNavigate()

  const [careers, setCareers] = useState([])
  const [semesters, setSemesters] = useState([])
  const [academicLoading, setAcademicLoading] = useState(true)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    careerId: "",
    semesterId: "",
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [captchaResetKey, setCaptchaResetKey] = useState(0)

  useEffect(() => {
    async function loadAcademicData() {
      setAcademicLoading(true)

      const [careersResult, semestersResult] = await Promise.all([
        supabase
          .from("careers")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("semesters")
          .select("id, name, level")
          .eq("is_active", true)
          .order("level"),
      ])

      if (careersResult.error || semestersResult.error) {
        setMessage("No se pudieron cargar las carreras y semestres.")
        setMessageType("error")
        setAcademicLoading(false)
        return
      }

      setCareers(careersResult.data ?? [])
      setSemesters(semestersResult.data ?? [])
      setAcademicLoading(false)
    }

    loadAcademicData()
  }, [])

  const completedFields = useMemo(() => {
    return Object.values(formData).filter((value) => String(value).trim()).length
  }, [formData])

  const formProgress = Math.round(
    (completedFields / Object.keys(formData).length) * 100,
  )

  const passwordScore = useMemo(() => {
    return passwordRules.filter((rule) => rule.test(formData.password)).length
  }, [formData.password])

  const passwordStrength =
    passwordScore <= 1
      ? { label: "Débil", width: "25%", className: "bg-red-500" }
      : passwordScore === 2
        ? { label: "Básica", width: "50%", className: "bg-amber-500" }
        : passwordScore === 3
          ? { label: "Buena", width: "75%", className: "bg-blue-500" }
          : { label: "Segura", width: "100%", className: "bg-emerald-500" }

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))

    if (messageType === "error") {
      setMessage("")
      setMessageType("")
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage("")
    setMessageType("")

    const {
      firstName,
      lastName,
      email,
      careerId,
      semesterId,
      password,
      confirmPassword,
    } = formData

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !careerId ||
      !semesterId ||
      !password ||
      !confirmPassword
    ) {
      setMessage("Completa todos los campos para crear tu cuenta.")
      setMessageType("error")
      return
    }

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.")
      setMessageType("error")
      return
    }

    if (passwordScore < passwordRules.length) {
      setMessage("La contraseña debe cumplir todos los requisitos de seguridad.")
      setMessageType("error")
      return
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.")
      setMessageType("error")
      return
    }

    if (!captchaToken) {
      setMessage("Completa la verificación de seguridad antes de crear la cuenta.")
      setMessageType("error")
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          career_id: Number(careerId),
          semester_id: Number(semesterId),
        },
        emailRedirectTo: `${window.location.origin}/cuenta-confirmada`,
        captchaToken,
      },
    })

    setCaptchaToken("")
    setCaptchaResetKey((current) => current + 1)

    if (error) {
      const translatedMessage =
        error.message === "User already registered"
          ? "Ya existe una cuenta con este correo. Intenta iniciar sesión."
          : error.message

      setMessage(translatedMessage)
      setMessageType("error")
      setLoading(false)
      return
    }

    if (!data.user) {
      setMessage("No fue posible crear la cuenta. Inténtalo nuevamente.")
      setMessageType("error")
      setLoading(false)
      return
    }

    if (data.session) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        career_id: Number(careerId),
        semester_id: Number(semesterId),
      })

      if (profileError) {
        setMessage(
          "La cuenta fue creada, pero ocurrió un problema al crear el perfil.",
        )
        setMessageType("error")
        setLoading(false)
        return
      }

      navigate("/dashboard")
      return
    }

    setMessage(
      "Cuenta creada correctamente. Revisa tu correo y confirma el registro antes de iniciar sesión.",
    )
    setMessageType("success")
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[0.82fr_1.18fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-indigo-800 via-blue-700 to-cyan-700 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -left-24 top-32 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

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

        <div className="relative z-10 max-w-lg py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <Sparkles size={16} />
            Únete a una comunidad que aprende junta
          </span>

          <h1 className="mt-6 text-5xl font-black leading-[1.08] tracking-tight">
            Crea tu perfil académico y empieza a conectar.
          </h1>

          <p className="mt-6 text-lg leading-8 text-blue-100">
            En pocos pasos podrás solicitar ayuda, ofrecer tutorías, compartir
            recursos y formar grupos de estudio.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Perfil universitario personalizado",
              "Acceso a tutorías y grupos de estudio",
              "Materiales compartidos por la comunidad",
              "Sistema de reputación y colaboración",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15">
                  <Check size={16} />
                </span>
                <span className="font-semibold text-blue-50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} />
            <div>
              <p className="font-bold">Registro protegido</p>
              <p className="mt-1 text-sm text-blue-100">
                La contraseña se procesa de forma segura mediante Supabase Auth.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-screen overflow-hidden bg-slate-50 px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />

        <div className="relative mx-auto w-full max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-700"
            >
              <ArrowLeft size={17} />
              Volver al inicio
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 transition hover:text-blue-800"
            >
              Ya tengo cuenta
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="mb-7 lg:hidden">
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

          <section className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                  <UsersRound size={14} />
                  Nuevo estudiante
                </span>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Crea tu cuenta
                </h1>
                <p className="mt-3 max-w-xl leading-7 text-slate-600">
                  Completa tus datos personales y académicos para comenzar a
                  usar AulaConecta.
                </p>
              </div>

              <div className="min-w-40 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4 text-xs font-bold">
                  <span className="text-slate-500">Progreso</span>
                  <span className="text-blue-700">{formProgress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
              </div>
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

            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-x-5 gap-y-6 md:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Nombres <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserRound
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    required
                    maxLength={80}
                    placeholder="Tus nombres"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserRound
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    required
                    maxLength={80}
                    placeholder="Tus apellidos"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Correo electrónico <span className="text-red-500">*</span>
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
                    maxLength={120}
                    placeholder="nombre@correo.com"
                    className={fieldClass}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Recibirás un enlace para confirmar y proteger tu cuenta.
                </p>
              </div>

              <div>
                <label
                  htmlFor="careerId"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Carrera <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <School
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    id="careerId"
                    name="careerId"
                    value={formData.careerId}
                    onChange={handleChange}
                    required
                    disabled={academicLoading}
                    className={`${fieldClass} appearance-none`}
                  >
                    <option value="">
                      {academicLoading
                        ? "Cargando carreras..."
                        : "Selecciona una carrera"}
                    </option>
                    {careers.map((career) => (
                      <option key={career.id} value={career.id}>
                        {career.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="semesterId"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Semestre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpenCheck
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    id="semesterId"
                    name="semesterId"
                    value={formData.semesterId}
                    onChange={handleChange}
                    required
                    disabled={academicLoading}
                    className={`${fieldClass} appearance-none`}
                  >
                    <option value="">
                      {academicLoading
                        ? "Cargando semestres..."
                        : "Selecciona un semestre"}
                    </option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className={`${fieldClass} pr-12`}
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Confirmar contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Repite la contraseña"
                    className={`${fieldClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmación"
                        : "Mostrar confirmación"
                    }
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                      formData.password === formData.confirmPassword
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {formData.password === formData.confirmPassword ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {formData.password === formData.confirmPassword
                      ? "Las contraseñas coinciden"
                      : "Las contraseñas todavía no coinciden"}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-slate-700">
                    Seguridad de la contraseña
                  </p>
                  <span className="text-xs font-bold text-slate-500">
                    {formData.password ? passwordStrength.label : "Sin evaluar"}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.className}`}
                    style={{
                      width: formData.password ? passwordStrength.width : "0%",
                    }}
                  />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {passwordRules.map((rule) => {
                    const completed = rule.test(formData.password)
                    return (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs font-semibold ${
                          completed ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full ${
                            completed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          <Check size={12} />
                        </span>
                        {rule.label}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  La contraseña debe cumplir todos los requisitos indicados.
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-3 text-sm font-bold text-slate-700">Verificación de seguridad</p>
                <TurnstileWidget
                  action="signup"
                  resetKey={captchaResetKey}
                  onToken={setCaptchaToken}
                />
              </div>

              <button
                type="submit"
                disabled={loading || academicLoading || messageType === "success" || !captchaToken}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 md:col-span-2"
              >
                {loading && <LoaderCircle className="animate-spin" size={19} />}
                {loading ? "Creando tu cuenta..." : "Crear cuenta en AulaConecta"}
              </button>
            </form>

            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              <ShieldCheck className="mt-0.5 shrink-0" size={19} />
              <p>
                Tus datos académicos se utilizarán para personalizar tu
                experiencia y ayudarte a encontrar contenido relevante.
              </p>
            </div>
          </section>

          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Necesitas ayuda?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-blue-700 transition hover:text-blue-800">
              {SUPPORT_EMAIL}
            </a>
          </p>

          <p className="mt-3 text-center text-sm text-slate-600">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-700 transition hover:text-blue-800"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Register
