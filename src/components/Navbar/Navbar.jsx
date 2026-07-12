import { useState } from "react"
import { Link } from "react-router-dom"

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          AulaConecta
        </Link>

        <div className="hidden items-center gap-8 font-medium text-slate-700 md:flex">
          <Link to="/" className="transition hover:text-blue-600">
            Inicio
          </Link>

          <a href="#tutorias" className="transition hover:text-blue-600">
            Tutorías
          </a>

          <a href="#materiales" className="transition hover:text-blue-600">
            Materiales
          </a>

          <a href="#grupos" className="transition hover:text-blue-600">
            Grupos
          </a>
        </div>

        <div className="hidden md:block">
          <Link
            to="/login"
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            Iniciar sesión
          </Link>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-700 transition hover:bg-slate-100 md:hidden"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4 font-medium text-slate-700">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-600"
            >
              Inicio
            </Link>

            <a
              href="#tutorias"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-600"
            >
              Tutorías
            </a>

            <a
              href="#materiales"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-600"
            >
              Materiales
            </a>

            <a
              href="#grupos"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-blue-600"
            >
              Grupos
            </a>

            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar