const currentYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            AulaConecta
          </h2>

          <p className="mt-4 max-w-sm leading-7 text-slate-400">
            Plataforma de colaboración académica para encontrar tutorías,
            grupos de estudio y materiales universitarios.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Aprender juntos es más fácil.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Plataforma
          </h3>

          <ul className="mt-5 space-y-3">
            <li>
              <a href="#" className="transition hover:text-blue-400">
                Inicio
              </a>
            </li>

            <li>
              <a href="#tutorias" className="transition hover:text-blue-400">
                Tutorías
              </a>
            </li>

            <li>
              <a href="#grupos" className="transition hover:text-blue-400">
                Grupos de estudio
              </a>
            </li>

            <li>
              <a href="#materiales" className="transition hover:text-blue-400">
                Materiales
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Información
          </h3>

          <ul className="mt-5 space-y-3">
            <li>
              <a href="#" className="transition hover:text-blue-400">
                Sobre nosotros
              </a>
            </li>

            <li>
              <a href="#" className="transition hover:text-blue-400">
                Privacidad
              </a>
            </li>

            <li>
              <a href="#" className="transition hover:text-blue-400">
                Términos de uso
              </a>
            </li>

            <li>
              <a href="#" className="transition hover:text-blue-400">
                Contacto
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white">
            Comunidad
          </h3>

          <p className="mt-5 leading-7 text-slate-400">
            Un entorno pensado para aprender, colaborar y compartir
            conocimientos de forma responsable.
          </p>

          <button className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700">
            Registrarse
          </button>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} AulaConecta. Todos los derechos reservados.
          </p>

          <p>
            Proyecto académico universitario
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer