import { supabase } from "./supabase"

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")

  return user
}

async function getMessageById(messageId) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      sender_id,
      message,
      created_at,
      sender:profiles!messages_sender_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("id", Number(messageId))
    .single()

  if (error) throw error

  return data
}

export async function getConversations() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("conversation_members")
    .select(`
      conversation_id,
      joined_at,
      conversation:conversations (
        id,
        created_at,
        members:conversation_members (
          user_id,
          profile:profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        ),
        messages (
          id,
          message,
          sender_id,
          created_at
        )
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })

  if (error) throw error

  return (data ?? [])
    .filter((membership) => membership.conversation)
    .map((membership) => {
      const conversation = membership.conversation

      const otherMember = conversation.members?.find(
        (member) => member.user_id !== user.id,
      )

      const sortedMessages = [...(conversation.messages ?? [])].sort(
        (firstMessage, secondMessage) =>
          new Date(firstMessage.created_at) -
          new Date(secondMessage.created_at),
      )

      const lastMessage =
        sortedMessages[sortedMessages.length - 1] ?? null

      return {
        id: conversation.id,
        createdAt: conversation.created_at,
        otherUser: otherMember?.profile ?? null,
        lastMessage,
      }
    })
    .sort((firstConversation, secondConversation) => {
      const firstDate =
        firstConversation.lastMessage?.created_at ??
        firstConversation.createdAt

      const secondDate =
        secondConversation.lastMessage?.created_at ??
        secondConversation.createdAt

      return new Date(secondDate) - new Date(firstDate)
    })
}

export async function getConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      sender_id,
      message,
      created_at,
      sender:profiles!messages_sender_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("conversation_id", Number(conversationId))
    .order("created_at", { ascending: true })

  if (error) throw error

  return data ?? []
}

export async function sendMessage(conversationId, message) {
  const user = await getAuthenticatedUser()
  const cleanMessage = message.trim()

  if (!cleanMessage) {
    throw new Error("Escribe un mensaje.")
  }

  if (cleanMessage.length > 2000) {
    throw new Error("El mensaje no puede superar los 2000 caracteres.")
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: Number(conversationId),
      sender_id: user.id,
      message: cleanMessage,
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      message,
      created_at,
      sender:profiles!messages_sender_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  return data
}

export function subscribeToConversation(
  conversationId,
  onNewMessage,
) {
  if (!conversationId) {
    return () => {}
  }

  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${Number(conversationId)}`,
      },
      async (payload) => {
        try {
          const message = await getMessageById(payload.new.id)
          onNewMessage(message)
        } catch (error) {
          console.error("Error cargando mensaje en tiempo real:", error)
        }
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToAllMessages(onNewMessage) {
  const channel = supabase
    .channel("all-user-messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      async (payload) => {
        try {
          const message = await getMessageById(payload.new.id)
          onNewMessage(message)
        } catch (error) {
          console.error("Error actualizando conversaciones:", error)
        }
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}