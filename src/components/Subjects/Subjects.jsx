import { BookOpenCheck, FileText, MessageSquareText, UsersRound } from "lucide-react"

const features = [
  {
    icon: BookOpenCheck,
    title: "Tutorías colaborativas",
    description: "Publica lo que necesitas aprender, revisa postulaciones y elige a la persona adecuada.",
    accent: "bg-blue-100 text-blue-600"
  },
  {
    icon: UsersRound,
    title: "Grupos de estudio",
    description: "Crea o únete a espacios de trabajo por materia, modalidad y horario.",
    accent: "bg-indigo-100 text-indigo-600"
  },
  {
    icon: FileText,
    title: "Materiales académicos",
    description: "Comparte apuntes, guías y documentos útiles con otros estudiantes.",
    accent: "bg-emerald-100 text-emerald-600"
  },
  {
    icon: MessageSquareText,
    title: "Comunicación integrada",
    description: "Coordina tus actividades desde el chat y recibe notificaciones en tiempo real.",
    accent: "bg-amber-100 text-amber-600"
  }
]

function Subjects() {
  return (
    <section id="funciones" className="bg-white px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Una plataforma, varias posibilidades</span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Todo lo necesario para aprender en comunidad</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">AulaConecta reúne las herramientas esenciales para pedir ayuda, colaborar y compartir conocimientos.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, accent }) => (
            <article key={title} className="group rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/60">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}><Icon size={26} /></span>
              <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
              <div className="mt-6 h-1 w-12 rounded-full bg-slate-200 transition-all duration-300 group-hover:w-20 group-hover:bg-blue-500" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Subjects
