function CTA() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-16 text-center text-white shadow-2xl shadow-blue-500/20 md:px-16">
        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
          Empieza hoy
        </span>

        <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          Conecta, aprende y comparte conocimientos con otros estudiantes
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">
          Crea tu cuenta, encuentra apoyo académico y participa en una
          comunidad universitaria segura y colaborativa.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50">
            Crear cuenta
          </button>

          <button className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20">
            Conocer más
          </button>
        </div>
      </div>
    </section>
  )
}

export default CTA