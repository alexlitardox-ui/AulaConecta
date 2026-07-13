import {
  LoaderCircle,
  MessageCircle,
  MessagesSquare,
  Search,
  Sparkles,
  UserRoundPlus,
} from "lucide-react"

function formatDate(date) {
  if (!date) return ""
  const value = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (value.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(value)
  }
  if (value.toDateString() === yesterday.toDateString()) return "Ayer"
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
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

function Avatar({ user, small = false }) {
  const size = small ? "h-10 w-10 rounded-xl" : "h-12 w-12 rounded-2xl"
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={getFullName(user)} className={`${size} shrink-0 object-cover ring-2 ring-white`} />
  }
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-sm ring-2 ring-white`}>
      {getInitials(user)}
    </div>
  )
}

function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
  searchTerm,
  onSearchChange,
  userResults = [],
  searchingUsers = false,
  startingUserId = null,
  onStartConversation,
}) {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredConversations = conversations.filter((conversation) => {
    const name = getFullName(conversation.otherUser).toLowerCase()
    const lastMessage = conversation.lastMessage?.message?.toLowerCase() ?? ""
    return name.includes(normalizedSearch) || lastMessage.includes(normalizedSearch)
  })

  const existingUserIds = new Set(
    filteredConversations.map((conversation) => conversation.otherUser?.id).filter(Boolean),
  )
  const newPeople = userResults.filter((user) => !existingUserIds.has(user.id))
  const hasSearch = normalizedSearch.length >= 2
  const hasAnyResult = filteredConversations.length > 0 || newPeople.length > 0

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
              <Sparkles size={13} /> Comunicación académica
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Mensajes</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Busca a un estudiante y escríbele directamente.</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-blue-600">
            <MessagesSquare size={21} />
          </div>
        </div>

        <div className="relative mt-5">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar usuario por nombre..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{conversations.length} conversaciones</span>
          {hasSearch && <span>{filteredConversations.length + newPeople.length} resultados</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {hasSearch && newPeople.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <UserRoundPlus size={14} /> Personas
            </div>
            <div className="space-y-2">
              {newPeople.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  disabled={startingUserId === user.id}
                  onClick={() => onStartConversation(user)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60 dark:border-blue-900 dark:bg-blue-950/30 dark:hover:bg-blue-950/60"
                >
                  <Avatar user={user} small />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900 dark:text-white">{getFullName(user)}</h3>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.bio || "Iniciar una conversación"}</p>
                  </div>
                  {startingUserId === user.id ? <LoaderCircle size={18} className="animate-spin text-blue-600" /> : <MessageCircle size={18} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {searchingUsers && hasSearch && (
          <div className="mb-3 flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
            <LoaderCircle size={17} className="animate-spin" /> Buscando estudiantes...
          </div>
        )}

        {filteredConversations.length > 0 && (
          <section>
            {hasSearch && <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">Conversaciones</div>}
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const isSelected = selectedConversationId === conversation.id
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => onSelect(conversation)}
                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ${isSelected ? "border-blue-200 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-950/40" : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900"}`}
                  >
                    {isSelected && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-blue-600" />}
                    <Avatar user={conversation.otherUser} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate font-bold text-slate-900 dark:text-white">{getFullName(conversation.otherUser)}</h3>
                        <span className={`shrink-0 text-[11px] ${isSelected ? "font-semibold text-blue-600" : "text-slate-400"}`}>
                          {formatDate(conversation.lastMessage?.created_at ?? conversation.createdAt)}
                        </span>
                      </div>
                      <p className={`mt-1 truncate text-sm ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {conversation.lastMessage?.message || "Conversación iniciada"}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {!searchingUsers && !hasAnyResult && (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-950"><MessageCircle size={29} /></div>
            <h2 className="mt-4 font-bold text-slate-900 dark:text-white">{hasSearch ? "No encontramos usuarios" : "Sin conversaciones"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {hasSearch ? "Escribe el nombre o apellido de otro estudiante." : "Busca a cualquier estudiante por su nombre para iniciar el chat."}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

export default ConversationList
