import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react"

function formatMessageTime(date) {
  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function formatDay(date) {
  const value = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (value.toDateString() === today.toDateString()) return "Hoy"
  if (value.toDateString() === yesterday.toDateString()) return "Ayer"

  return new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(value)
}

function getFullName(user) {
  if (!user) return "Estudiante"
  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Estudiante"
}

function getInitials(user) {
  if (!user) return "ES"
  return `${user.first_name?.charAt(0) ?? ""}${user.last_name?.charAt(0) ?? ""}`.toUpperCase() || "ES"
}

function Avatar({ user, size = "h-11 w-11" }) {
  const fullName = getFullName(user)

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={fullName}
        className={`${size} shrink-0 rounded-2xl object-cover ring-2 ring-white shadow-sm`}
      />
    )
  }

  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-sm ring-2 ring-white`}>
      {getInitials(user)}
    </div>
  )
}

function MessagePanel({
  conversation,
  messages,
  currentUserId,
  loading,
  sending,
  onSend,
  onBack,
}) {
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const messagesWithSeparators = useMemo(() => {
    let previousDay = null

    return messages.map((currentMessage) => {
      const day = new Date(currentMessage.created_at).toDateString()
      const showDay = day !== previousDay
      previousDay = day

      return { currentMessage, showDay }
    })
  }, [messages])

  async function handleSubmit(event) {
    event.preventDefault()

    const cleanMessage = message.trim()
    if (!cleanMessage || sending) return

    const sent = await onSend(cleanMessage)
    if (sent) setMessage("")
  }

  if (!conversation) {
    return (
      <section className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 shadow-sm">
            <MessageCircle size={34} />
          </div>

          <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
            Selecciona una conversación
          </h2>

          <p className="mt-3 leading-7 text-slate-500">
            Elige un estudiante para consultar el historial y coordinar actividades académicas de forma privada.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={15} />
            Conversaciones privadas
          </div>
        </div>
      </section>
    )
  }

  const fullName = getFullName(conversation.otherUser)
  const remainingCharacters = 2000 - message.length

  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-50">
      <header className="flex min-h-20 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          aria-label="Volver a conversaciones"
        >
          <ArrowLeft size={20} />
        </button>

        <Avatar user={conversation.otherUser} />

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-black text-slate-950">{fullName}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ShieldCheck size={13} />
            Conversación privada
          </p>
        </div>

        <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 sm:block">
          {messages.length} mensajes
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.55),_transparent_35%)] px-4 py-6 sm:px-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
              <p className="mt-3 text-sm text-slate-500">Cargando mensajes...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-3xl border border-slate-200 bg-white/90 p-7 text-center shadow-sm backdrop-blur">
              <MessageCircle size={32} className="mx-auto text-blue-600" />
              <h3 className="mt-4 font-black text-slate-900">Empieza la conversación</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Envía un mensaje respetuoso para coordinar una tutoría, solicitud o grupo de estudio.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {messagesWithSeparators.map(({ currentMessage, showDay }) => {
              const isOwnMessage = currentMessage.sender_id === currentUserId

              return (
                <div key={currentMessage.id}>
                  {showDay && (
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold capitalize text-slate-500 shadow-sm">
                        {formatDay(currentMessage.created_at)}
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}

                  <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
                      isOwnMessage
                        ? "rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                    }`}>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 sm:text-base">
                        {currentMessage.message}
                      </p>

                      <div className={`mt-2 flex items-center justify-end gap-1 text-[11px] ${isOwnMessage ? "text-blue-100" : "text-slate-400"}`}>
                        <span>{formatMessageTime(currentMessage.created_at)}</span>
                        {isOwnMessage && <CheckCheck size={14} aria-label="Enviado" />}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 sm:gap-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit(event)
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Escribe un mensaje..."
              className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
            />

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              aria-label="Enviar mensaje"
            >
              <Send size={19} />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-slate-400">
            <span>Enter para enviar · Shift + Enter para nueva línea</span>
            <span className={remainingCharacters < 150 ? "font-semibold text-amber-600" : ""}>
              {remainingCharacters}
            </span>
          </div>
        </div>
      </form>
    </section>
  )
}

export default MessagePanel
