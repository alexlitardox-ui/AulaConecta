import { Link } from "react-router-dom"
import { ArrowRight, BookOpen, CheckCircle2, MessageCircle, ShieldCheck, Star, Users } from "lucide-react"

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-slate-950 px-5 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.35),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.30),transparent_32%)]" />
      <div className="absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-200">
            <ShieldCheck size={16} />
            Diseñado para la comunidad universitaria
          </span>

          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-7xl">
            El apoyo académico que necesitas,
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent"> en un solo lugar.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Conecta con estudiantes, solicita tutorías, crea grupos de estudio y comparte materiales dentro de una plataforma colaborativa y segura.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link to="/registro" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-1 hover:bg-blue-500">
              Empezar ahora
              <ArrowRight size={19} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-bold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10">
              Ya tengo una cuenta
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Tutorías entre estudiantes", "Perfiles con reputación", "Mensajería integrada"].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="rounded-[1.5rem] bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Tu espacio académico</p>
                  <h2 className="mt-2 text-2xl font-black">Todo conectado</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Organiza tu aprendizaje sin salir de la plataforma.</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><BookOpen size={24} /></span>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { icon: Users, title: "Encuentra apoyo", text: "Publica una solicitud y recibe postulaciones." },
                  { icon: MessageCircle, title: "Coordina en tiempo real", text: "Conversa directamente desde el chat." },
                  { icon: Star, title: "Construye confianza", text: "Valora las tutorías y mejora tu reputación." }
                ].map(({ icon: Icon, title, text }, index) => (
                  <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${index === 0 ? "bg-blue-100 text-blue-600" : index === 1 ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"}`}>
                      <Icon size={21} />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white">
                <div>
                  <p className="text-xs text-slate-400">Tu próximo paso</p>
                  <p className="mt-1 font-bold">Crea tu perfil académico</p>
                </div>
                <Link to="/registro" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 transition hover:bg-blue-500" aria-label="Crear cuenta">
                  <ArrowRight size={19} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
