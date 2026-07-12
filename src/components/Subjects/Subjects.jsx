const subjects = [
  {
    emoji: "💻",
    title: "Programación",
    description: "Aprende algoritmos, estructuras de datos y desarrollo web."
  },
  {
    emoji: "🗄️",
    title: "Base de Datos",
    description: "SQL, PostgreSQL, MySQL y modelado relacional."
  },
  {
    emoji: "📐",
    title: "Cálculo",
    description: "Límites, derivadas, integrales y cálculo multivariable."
  },
  {
    emoji: "📊",
    title: "Estadística",
    description: "Probabilidad, inferencia y análisis de datos."
  }
]

function Subjects() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <h2 className="text-center text-4xl font-bold text-slate-900">
          Materias populares
        </h2>

        <p className="mt-4 text-center text-slate-600">
          Encuentra ayuda en las asignaturas más solicitadas por los estudiantes.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {subjects.map((subject) => (

            <div
              key={subject.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >

              <div className="text-5xl">
                {subject.emoji}
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-900">
                {subject.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {subject.description}
              </p>

            </div>

          ))}

        </div>

      </div>
    </section>
  )
}

export default Subjects