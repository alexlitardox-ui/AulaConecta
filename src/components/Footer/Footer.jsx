import { Link } from "react-router-dom"
import { GraduationCap, Heart } from "lucide-react"

const currentYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="bg-slate-950 px-5 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 py-16 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div>
          <a href="#inicio" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white"><GraduationCap size={23} /></span>
            <span className="text-xl font-black text-white">AulaConecta</span>
          </a>
          <p className="mt-5 max-w-md leading-7 text-slate-400">Una plataforma académica para solicitar tutorías, crear grupos de estudio, compartir materiales y construir una comunidad universitaria colaborativa.</p>
        </div>

        <div>
          <h3 className="font-black text-white">Explorar</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li><a href="#funciones" className="transition hover:text-blue-400">Funciones</a></li>
            <li><a href="#como-funciona" className="transition hover:text-blue-400">Cómo funciona</a></li>
            <li><a href="#comunidad" className="transition hover:text-blue-400">Comunidad</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-black text-white">Acceso</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link to="/login" className="transition hover:text-blue-400">Iniciar sesión</Link></li>
            <li><Link to="/registro" className="transition hover:text-blue-400">Crear cuenta</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} AulaConecta. Proyecto académico universitario.</p>
          <p className="inline-flex items-center gap-1.5">Construido para aprender en comunidad <Heart size={14} className="text-blue-400" /></p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
