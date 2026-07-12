const steps = [
  {
    number: "01",
    title: "Busca ayuda",
    description:
      "Explora tutores, materias y solicitudes según tus necesidades académicas."
  },
  {
    number: "02",
    title: "Conecta con un tutor",
    description:
      "Revisa perfiles, horarios y valoraciones antes de elegir la mejor opción."
  },
  {
    number: "03",
    title: "Aprende y valora",
    description:
      "Participa en la tutoría, mejora tus conocimientos y comparte tu experiencia."
  }
]

function HowItWorks() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            Proceso sencillo
          </span>

          <h2 className="mt-5 text-4xl font-bold text-slate-900">
            ¿Cómo funciona AulaConecta?
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Encuentra apoyo académico en pocos pasos y forma parte de una
            comunidad colaborativa.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
                {step.number}
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-900">
                {step.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks