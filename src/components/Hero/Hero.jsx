function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50 px-6 py-20 lg:px-12 lg:py-28">
      <div className="absolute left-0 top-0 -z-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-0 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Comunidad académica universitaria
          </span>

          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Aprende mejor,
            <span className="text-blue-600"> conectando con otros estudiantes.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Encuentra tutorías, crea grupos de estudio y comparte recursos
            académicos dentro de una comunidad segura y colaborativa.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
              Buscar tutor
            </button>

            <button className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600">
              Ofrecer ayuda
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-600">
            <div>
              <strong className="block text-2xl text-slate-900">100+</strong>
              Estudiantes
            </div>

            <div>
              <strong className="block text-2xl text-slate-900">40+</strong>
              Tutorías
            </div>

            <div>
              <strong className="block text-2xl text-slate-900">15+</strong>
              Materias
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-sm text-slate-500">Tutor destacado</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Encuentra apoyo académico
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                🎓
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  CL
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">Carlos López</h3>
                  <p className="text-sm text-slate-500">
                    Ciencia de Datos e Inteligencia Artificial
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <span className="text-yellow-500">★★★★★</span>
                <span className="text-sm font-semibold text-slate-700">4.9</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  Base de Datos
                </span>

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                  Programación
                </span>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
                  Estadística
                </span>
              </div>

              <button className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800">
                Ver perfil
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Tutorías realizadas</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">42</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Disponible</p>
                <p className="mt-1 text-lg font-bold text-emerald-600">Hoy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero