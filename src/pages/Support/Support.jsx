import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Clock3,
  Headphones,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Star,
  TicketCheck,
  UserRound,
  X,
} from "lucide-react"

import Button from "../../components/UI/Button"
import FeedbackAlert from "../../components/UI/FeedbackAlert"
import PageHeader from "../../components/UI/PageHeader"
import {
  addSupportMessage,
  createSupportTicket,
  getSupportContext,
  getSupportMessages,
  getSupportTickets,
  rateSupportTicket,
  updateSupportTicket,
} from "../../services/supportService"

const categories = [
  "Inicio de sesión",
  "Perfil",
  "Tutorías",
  "Solicitudes",
  "Materiales",
  "Grupos",
  "Mensajería",
  "Notificaciones",
  "Seguridad",
  "Sugerencias",
  "Otros",
]

const statusClasses = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Resuelto: "bg-emerald-100 text-emerald-800",
  Cerrado: "bg-slate-200 text-slate-700",
}

const priorityClasses = {
  Baja: "bg-slate-100 text-slate-700",
  Media: "bg-violet-100 text-violet-700",
  Alta: "bg-red-100 text-red-700",
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function personName(person) {
  return `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim() || "Usuario"
}

function Support() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [context, setContext] = useState(null)
  const [tickets, setTickets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [working, setWorking] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [reply, setReply] = useState("")
  const [form, setForm] = useState({
    subject: "",
    category: "Otros",
    description: "",
    priority: "Media",
  })

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? null

  async function loadTickets(preferredId = null) {
    setLoading(true)
    setError("")

    try {
      const currentContext = context ?? (await getSupportContext())
      if (!context) setContext(currentContext)
      const data = await getSupportTickets({ isAdmin: currentContext.isAdmin })
      setTickets(data)

      const requestedId = Number(preferredId ?? searchParams.get("ticket"))
      const nextId = data.some((item) => item.id === requestedId)
        ? requestedId
        : data[0]?.id ?? null
      setSelectedId(nextId)
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el Centro de Soporte.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    setSearchParams({ ticket: String(selectedId) }, { replace: true })
    setLoadingMessages(true)
    getSupportMessages(selectedId)
      .then(setMessages)
      .catch((messageError) => setError(messageError.message || "No se pudo cargar la conversación."))
      .finally(() => setLoadingMessages(false))
  }, [selectedId, setSearchParams])

  const filteredTickets = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "Todos" || ticket.status === statusFilter
      const haystack = `${ticket.id} ${ticket.subject} ${ticket.category} ${ticket.description} ${personName(ticket.user)}`.toLowerCase()
      return matchesStatus && (!cleanQuery || haystack.includes(cleanQuery))
    })
  }, [query, statusFilter, tickets])

  const metrics = useMemo(() => ({
    pending: tickets.filter((item) => item.status === "Pendiente").length,
    progress: tickets.filter((item) => item.status === "En proceso").length,
    resolved: tickets.filter((item) => ["Resuelto", "Cerrado"].includes(item.status)).length,
  }), [tickets])

  async function handleCreate(event) {
    event.preventDefault()
    setWorking(true)
    setError("")
    setNotice("")

    try {
      const ticketId = await createSupportTicket(form)
      setForm({ subject: "", category: "Otros", description: "", priority: "Media" })
      setShowForm(false)
      setNotice(`Ticket #${ticketId} creado correctamente.`)
      await loadTickets(ticketId)
    } catch (createError) {
      setError(createError.message || "No se pudo crear el ticket.")
    } finally {
      setWorking(false)
    }
  }

  async function handleReply(event) {
    event.preventDefault()
    if (!reply.trim() || !selectedTicket) return
    setWorking(true)
    setError("")

    try {
      await addSupportMessage(selectedTicket.id, reply.trim())
      setReply("")
      setMessages(await getSupportMessages(selectedTicket.id))
      await loadTickets(selectedTicket.id)
    } catch (replyError) {
      setError(replyError.message || "No se pudo enviar la respuesta.")
    } finally {
      setWorking(false)
    }
  }

  async function handleAdminUpdate(field, value) {
    if (!selectedTicket) return
    setWorking(true)
    setError("")

    try {
      await updateSupportTicket(selectedTicket.id, {
        status: field === "status" ? value : selectedTicket.status,
        priority: field === "priority" ? value : selectedTicket.priority,
        assignedAdmin: selectedTicket.assigned_admin,
      })
      setNotice("Ticket actualizado correctamente.")
      await loadTickets(selectedTicket.id)
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el ticket.")
    } finally {
      setWorking(false)
    }
  }

  async function handleRating(rating) {
    setWorking(true)
    try {
      await rateSupportTicket(selectedTicket.id, rating)
      setNotice("Gracias por calificar la atención.")
      await loadTickets(selectedTicket.id)
    } catch (ratingError) {
      setError(ratingError.message || "No se pudo guardar la calificación.")
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><LoaderCircle className="animate-spin text-blue-600" size={36} /></div>
  }

  return (
    <main className="px-4 py-7 sm:px-7 lg:px-9">
      <div className="mx-auto max-w-7xl space-y-7">
        <PageHeader
          eyebrow={context?.isAdmin ? "Mesa administrativa" : "Ayuda al usuario"}
          title="Centro de Soporte y Ayuda"
          description={context?.isAdmin
            ? "Atiende incidencias, responde consultas y realiza seguimiento a los tickets de AulaConecta."
            : "Reporta problemas, realiza consultas o envía sugerencias al equipo administrador."}
          icon={Headphones}
          actions={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => loadTickets(selectedId)} disabled={working}>
                <RefreshCw size={17} /> Actualizar
              </Button>
              {!context?.isAdmin && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={18} /> Nuevo ticket
                </Button>
              )}
            </div>
          }
        />

        {notice && <FeedbackAlert type="success">{notice}</FeedbackAlert>}
        {error && <FeedbackAlert type="error">{error}</FeedbackAlert>}

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            [Clock3, "Pendientes", metrics.pending, "bg-amber-100 text-amber-700"],
            [MessageCircle, "En proceso", metrics.progress, "bg-blue-100 text-blue-700"],
            [TicketCheck, "Resueltos", metrics.resolved, "bg-emerald-100 text-emerald-700"],
          ].map(([Icon, label, value, className]) => (
            <article key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${className}`}><Icon size={22} /></span>
                <div><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-black text-slate-950">{value}</p></div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 p-4 xl:border-b-0 xl:border-r">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tickets..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none">
              {["Todos", "Pendiente", "En proceso", "Resuelto", "Cerrado"].map((status) => <option key={status}>{status}</option>)}
            </select>

            <div className="mt-4 max-h-[500px] space-y-2 overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No hay tickets para mostrar.</div>
              ) : filteredTickets.map((ticket) => (
                <button key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === ticket.id ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}>
                  <div className="flex items-start justify-between gap-3"><p className="font-black text-slate-900">#{ticket.id} · {ticket.subject}</p><span className={`rounded-full px-2 py-1 text-[10px] font-black ${statusClasses[ticket.status]}`}>{ticket.status}</span></div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{ticket.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs"><span className={`rounded-full px-2 py-1 font-bold ${priorityClasses[ticket.priority]}`}>{ticket.priority}</span><span className="text-slate-400">{formatDate(ticket.updated_at)}</span></div>
                  {context?.isAdmin && <p className="mt-2 truncate text-xs font-semibold text-slate-600"><UserRound size={13} className="mr-1 inline" />{personName(ticket.user)}</p>}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            {!selectedTicket ? (
              <div className="grid flex-1 place-items-center p-10 text-center"><div><Headphones className="mx-auto text-blue-500" size={48} /><h2 className="mt-4 text-xl font-black">Selecciona un ticket</h2><p className="mt-2 text-sm text-slate-500">Aquí podrás revisar el detalle y la conversación.</p></div></div>
            ) : (
              <>
                <header className="border-b border-slate-200 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Ticket #{selectedTicket.id}</p><h2 className="mt-2 text-2xl font-black text-slate-950">{selectedTicket.subject}</h2><p className="mt-2 text-sm text-slate-500">{selectedTicket.category} · creado {formatDate(selectedTicket.created_at)}</p></div>
                    <div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusClasses[selectedTicket.status]}`}>{selectedTicket.status}</span><span className={`rounded-full px-3 py-1.5 text-xs font-black ${priorityClasses[selectedTicket.priority]}`}>Prioridad {selectedTicket.priority}</span></div>
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selectedTicket.description}</div>

                  {context?.isAdmin && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-bold text-slate-700">Estado
                        <select value={selectedTicket.status} onChange={(event) => handleAdminUpdate("status", event.target.value)} disabled={working} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium">
                          {["Pendiente", "En proceso", "Resuelto", "Cerrado"].map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </label>
                      <label className="text-sm font-bold text-slate-700">Prioridad
                        <select value={selectedTicket.priority} onChange={(event) => handleAdminUpdate("priority", event.target.value)} disabled={working} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium">
                          {["Baja", "Media", "Alta"].map((priority) => <option key={priority}>{priority}</option>)}
                        </select>
                      </label>
                    </div>
                  )}
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5 sm:p-6">
                  {loadingMessages ? <LoaderCircle className="mx-auto animate-spin text-blue-600" /> : messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Todavía no existen respuestas. Escribe el primer mensaje.</div>
                  ) : messages.map((item) => {
                    const mine = item.sender_id === context?.user?.id
                    const senderAdmin = Boolean(item.sender?.is_admin || item.sender?.role === "admin")
                    return <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}><p className={`mb-1 text-xs font-black ${mine ? "text-blue-100" : senderAdmin ? "text-violet-600" : "text-slate-500"}`}>{mine ? "Tú" : personName(item.sender)}{senderAdmin && !mine ? " · Administrador" : ""}</p><p className="whitespace-pre-wrap text-sm leading-6">{item.message}</p><p className={`mt-2 text-[10px] ${mine ? "text-blue-200" : "text-slate-400"}`}>{formatDate(item.created_at)}</p></div></div>
                  })}
                </div>

                {selectedTicket.status !== "Cerrado" ? (
                  <form onSubmit={handleReply} className="border-t border-slate-200 bg-white p-4 sm:p-5"><div className="flex gap-3"><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={2} maxLength={3000} placeholder="Escribe una respuesta..." className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><Button type="submit" disabled={working || !reply.trim()} className="self-end"><Send size={18} /><span className="hidden sm:inline">Enviar</span></Button></div></form>
                ) : (
                  <div className="border-t border-slate-200 bg-white p-5 text-center text-sm font-semibold text-slate-500">Este ticket está cerrado y ya no admite respuestas.</div>
                )}

                {!context?.isAdmin && ["Resuelto", "Cerrado"].includes(selectedTicket.status) && !selectedTicket.satisfaction_rating && (
                  <div className="border-t border-slate-200 bg-amber-50 p-5 text-center"><p className="font-bold text-slate-800">¿La atención resolvió tu problema?</p><div className="mt-3 flex justify-center gap-2">{[1,2,3,4,5].map((rating) => <button key={rating} type="button" onClick={() => handleRating(rating)} disabled={working} className="text-amber-400 transition hover:scale-125"><Star size={25} fill="currentColor" /></button>)}</div></div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Nueva solicitud</p><h2 className="mt-2 text-2xl font-black">Crear ticket de soporte</h2></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X /></button></div>
            <div className="mt-6 space-y-5">
              <label className="block text-sm font-bold">Asunto<input required minLength={5} maxLength={140} value={form.subject} onChange={(event) => setForm({...form, subject: event.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Ej. No puedo subir un material PDF" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Categoría<select value={form.category} onChange={(event) => setForm({...form, category: event.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-sm font-bold">Prioridad<select value={form.priority} onChange={(event) => setForm({...form, priority: event.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3">{["Baja", "Media", "Alta"].map((priority) => <option key={priority}>{priority}</option>)}</select></label></div>
              <label className="block text-sm font-bold">Descripción<textarea required minLength={10} maxLength={4000} rows={6} value={form.description} onChange={(event) => setForm({...form, description: event.target.value})} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Explica qué ocurrió, qué intentabas hacer y qué mensaje apareció." /></label>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><ShieldCheck size={18} className="mr-2 inline" />No incluyas contraseñas, códigos de verificación ni información bancaria.</div>
            </div>
            <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={working}>{working ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />} Crear ticket</Button></div>
          </form>
        </div>
      )}
    </main>
  )
}

export default Support
