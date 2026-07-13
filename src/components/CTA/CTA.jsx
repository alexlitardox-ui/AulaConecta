import { Link } from "react-router-dom"
import { ArrowRight, GraduationCap } from "lucide-react"

function CTA() {
  return (
    <section className="bg-white px-5 py-24 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-7 py-16 text-center text-white shadow-2xl shadow-blue-600/25 sm:px-12 lg:px-20">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -right-12 h-72 w-72 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10"><GraduationCap size={32} /></span>
          <h2 className="mx-auto mt-7 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">Tu próxima conexión académica puede empezar hoy</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">Crea tu cuenta, completa tu perfil y empieza a colaborar con otros estudiantes dentro de AulaConecta.</p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/registro" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-blue-700 transition hover:-translate-y-1 hover:bg-blue-50">
              Crear cuenta
              <ArrowRight size={19} />
            </Link>
            <Link to="/login" className="rounded-2xl border border-white/25 bg-white/10 px-6 py-4 font-black text-white transition hover:bg-white/20">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
