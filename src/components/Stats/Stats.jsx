import { BellRing, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react"

const points = [
  { icon: ShieldCheck, title: "Confianza", text: "Perfiles, valoraciones y estados claros para cada actividad." },
  { icon: BellRing, title: "Seguimiento", text: "Notificaciones para no perder solicitudes, mensajes ni novedades." },
  { icon: MessagesSquare, title: "Comunicación", text: "Chat integrado para coordinar sin depender de otras aplicaciones." },
  { icon: Sparkles, title: "Crecimiento", text: "Tu actividad y reputación reflejan tu aporte a la comunidad." }
]

function Stats() {
  return (
    <section id="comunidad" className="relative overflow-hidden bg-slate-950 px-5 py-24 text-white sm:px-6 lg:px-8">
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-300">Una comunidad construida con confianza</span>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Más que una lista de tutorías</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">Cada módulo está conectado para ayudarte a organizar tu experiencia académica de principio a fin.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-7 backdrop-blur transition hover:-translate-y-2 hover:bg-white/[0.10]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><Icon size={23} /></span>
              <h3 className="mt-6 text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
