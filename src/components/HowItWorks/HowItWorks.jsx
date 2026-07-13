import { CheckCircle2, Search, UserRoundCheck } from "lucide-react"

const steps = [
  { number: "01", icon: UserRoundCheck, title: "Crea tu perfil", description: "Registra tus datos académicos para que la comunidad pueda conocerte y confiar en ti." },
  { number: "02", icon: Search, title: "Encuentra lo que necesitas", description: "Busca solicitudes, tutorías, grupos o materiales relacionados con tus materias." },
  { number: "03", icon: CheckCircle2, title: "Colabora y avanza", description: "Coordina, participa, completa la actividad y comparte una valoración al finalizar." }
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-slate-50 px-5 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <span className="inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">Proceso sencillo</span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Empieza a colaborar en tres pasos</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">La plataforma está diseñada para que puedas pasar de una necesidad académica a una conexión útil de forma clara y ordenada.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <article key={number} className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm">
                <span className="absolute right-5 top-4 text-5xl font-black text-slate-100">{number}</span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon size={22} /></span>
                <h3 className="relative mt-6 text-xl font-black text-slate-950">{title}</h3>
                <p className="relative mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
