import { useCallback, useEffect, useState } from "react"
import { MessageCircleMore, Sparkles } from "lucide-react"

import ConversationList from "../../components/Chat/ConversationList"
import MessagePanel from "../../components/Chat/MessagePanel"
import {
  getConversationMessages,
  getConversations,
  sendMessage,
  subscribeToAllMessages,
  subscribeToConversation,
} from "../../services/chatService"
import { supabase } from "../../services/supabase"

function sortConversations(conversations) {
  return [...conversations].sort((firstConversation, secondConversation) => {
    const firstDate =
      firstConversation.lastMessage?.created_at ?? firstConversation.createdAt
    const secondDate =
      secondConversation.lastMessage?.created_at ?? secondConversation.createdAt

    return new Date(secondDate) - new Date(firstDate)
  })
}

function Chat() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState("")

  const loadConversations = useCallback(async ({ preserveSelection = true } = {}) => {
    const data = await getConversations()
    setConversations(data)

    if (!preserveSelection) {
      setSelectedConversation(data[0] ?? null)
      return
    }

    setSelectedConversation((currentConversation) => {
      if (!currentConversation) return data[0] ?? null

      return (
        data.find((conversation) => conversation.id === currentConversation.id) ??
        data[0] ??
        null
      )
    })
  }, [])

  useEffect(() => {
    let unsubscribeAllMessages = () => {}
    let mounted = true

    async function loadInitialData() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) throw error
        if (!mounted) return

        setCurrentUserId(user?.id ?? null)
        await loadConversations({ preserveSelection: false })

        unsubscribeAllMessages = subscribeToAllMessages((newMessage) => {
          if (!mounted) return

          setConversations((currentConversations) => {
            const conversationExists = currentConversations.some(
              (conversation) => conversation.id === newMessage.conversation_id,
            )

            if (!conversationExists) {
              loadConversations().catch((error) => {
                console.error(error)
              })
              return currentConversations
            }

            const updatedConversations = currentConversations.map((conversation) =>
              conversation.id === newMessage.conversation_id
                ? { ...conversation, lastMessage: newMessage }
                : conversation,
            )

            return sortConversations(updatedConversations)
          })
        })
      } catch (error) {
        console.error(error)
        if (mounted) setFeedback("No se pudieron cargar las conversaciones.")
      } finally {
        if (mounted) setLoadingConversations(false)
      }
    }

    loadInitialData()

    return () => {
      mounted = false
      unsubscribeAllMessages()
    }
  }, [loadConversations])

  useEffect(() => {
    const conversationId = selectedConversation?.id

    if (!conversationId) {
      setMessages([])
      return undefined
    }

    let unsubscribeConversation = () => {}
    let mounted = true

    async function loadMessages() {
      setLoadingMessages(true)
      setFeedback("")

      try {
        const data = await getConversationMessages(conversationId)
        if (!mounted) return

        setMessages(data)
        unsubscribeConversation = subscribeToConversation(conversationId, (newMessage) => {
          setMessages((currentMessages) => {
            const alreadyExists = currentMessages.some(
              (currentMessage) => currentMessage.id === newMessage.id,
            )

            return alreadyExists ? currentMessages : [...currentMessages, newMessage]
          })
        })
      } catch (error) {
        console.error(error)
        if (mounted) setFeedback("No se pudieron cargar los mensajes.")
      } finally {
        if (mounted) setLoadingMessages(false)
      }
    }

    loadMessages()

    return () => {
      mounted = false
      unsubscribeConversation()
    }
  }, [selectedConversation])

  async function handleSend(messageText) {
    if (!selectedConversation) return false

    setSending(true)
    setFeedback("")

    try {
      const createdMessage = await sendMessage(selectedConversation.id, messageText)

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (currentMessage) => currentMessage.id === createdMessage.id,
        )

        return alreadyExists ? currentMessages : [...currentMessages, createdMessage]
      })

      setConversations((currentConversations) => {
        const updatedConversations = currentConversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? { ...conversation, lastMessage: createdMessage }
            : conversation,
        )

        return sortConversations(updatedConversations)
      })

      return true
    } catch (error) {
      console.error(error)
      setFeedback(error.message || "No se pudo enviar el mensaje.")
      return false
    } finally {
      setSending(false)
    }
  }

  if (loadingConversations) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-10 py-9 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MessageCircleMore size={26} />
          </div>
          <div className="mx-auto mt-5 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 font-medium text-slate-600">Cargando conversaciones...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-3 sm:p-6">
      <div className="mx-auto mb-4 flex max-w-7xl items-center gap-2 text-xs font-semibold text-slate-500">
        <Sparkles size={14} className="text-blue-600" />
        Tus mensajes se actualizan en tiempo real
      </div>

      {feedback && (
        <div className="mx-auto mb-4 max-w-7xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {feedback}
        </div>
      )}

      <section className="mx-auto grid h-[calc(100dvh-8.5rem)] min-h-[560px] max-w-7xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-[360px_1fr]">
        <div className={selectedConversation ? "hidden lg:block" : "block"}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelect={setSelectedConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <div className={selectedConversation ? "block" : "hidden lg:block"}>
          <MessagePanel
            conversation={selectedConversation}
            messages={messages}
            currentUserId={currentUserId}
            loading={loadingMessages}
            sending={sending}
            onSend={handleSend}
            onBack={() => setSelectedConversation(null)}
          />
        </div>
      </section>
    </main>
  )
}

export default Chat
