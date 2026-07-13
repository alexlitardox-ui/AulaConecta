import { useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, GraduationCap, Menu, X } from "lucide-react"

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Funciones", href: "#funciones" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Comunidad", href: "#comunidad" }
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex items-center gap-3" onClick={closeMenu}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
            <GraduationCap size={24} />
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight text-slate-950">AulaConecta</span>
            <span className="block text-xs font-medium text-slate-500">Comunidad académica</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-blue-600">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
            Iniciar sesión
          </Link>
          <Link to="/registro" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-600">
            <BookOpen size={17} />
            Crear cuenta
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 py-5 shadow-xl md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu} className="rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600">
                {link.label}
              </a>
            ))}
            <div className="my-2 h-px bg-slate-200" />
            <Link to="/login" onClick={closeMenu} className="rounded-xl border border-slate-200 px-4 py-3 text-center font-bold text-slate-700">
              Iniciar sesión
            </Link>
            <Link to="/registro" onClick={closeMenu} className="rounded-xl bg-blue-600 px-4 py-3 text-center font-bold text-white">
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
