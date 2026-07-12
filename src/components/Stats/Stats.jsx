const stats = [
  {
    value: "250+",
    label: "Estudiantes registrados",
    description: "Formando una comunidad académica colaborativa."
  },
  {
    value: "120+",
    label: "Tutorías realizadas",
    description: "Sesiones de apoyo completadas entre estudiantes."
  },
  {
    value: "45+",
    label: "Grupos de estudio",
    description: "Espacios creados para aprender en equipo."
  },
  {
    value: "30+",
    label: "Materias disponibles",
    description: "Opciones de apoyo en distintas áreas académicas."
  }
]

function Stats() {
  return (
    <section className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-300">
            Comunidad en crecimiento
          </span>

          <h2 className="mt-5 text-4xl font-bold">
            Aprender juntos genera mejores resultados
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            AulaConecta reúne estudiantes, tutorías, grupos y materias dentro
            de un mismo entorno académico.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:-translate-y-2 hover:bg-white/10"
            >
              <p className="text-4xl font-bold text-blue-400">
                {stat.value}
              </p>

              <h3 className="mt-4 text-lg font-semibold">
                {stat.label}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {stat.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats