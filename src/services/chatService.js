import { supabase } from "./supabase"

async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")
  return user
}

async function attachSenders(messages) {
  const rows = messages ?? []
  const senderIds = [...new Set(rows.map((item) => item.sender_id).filter(Boolean))]
  if (!senderIds.length) return rows.map((item) => ({ ...item, sender: null }))
  const { data, error } = await supabase.from("profiles").select("id,first_name,last_name,avatar_url").in("id", senderIds)
  if (error) {
    console.warn("No se pudieron cargar remitentes:", error)
    return rows.map((item) => ({ ...item, sender: null }))
  }
  const profiles = new Map((data ?? []).map((item) => [item.id, item]))
  return rows.map((item) => ({ ...item, sender: profiles.get(item.sender_id) ?? null }))
}

async function getMessageById(messageId) {
  const { data, error } = await supabase.from("messages").select("id,conversation_id,sender_id,message,created_at").eq("id", Number(messageId)).maybeSingle()
  if (error) throw error
  if (!data) return null
  return (await attachSenders([data]))[0]
}

export async function getConversations() {
  const user = await getAuthenticatedUser()
  const { data: ownMemberships, error } = await supabase.from("conversation_members")
    .select("conversation_id,joined_at").eq("user_id", user.id).order("joined_at", { ascending: false })
  if (error) throw error
  const conversationIds = [...new Set((ownMemberships ?? []).map((item) => item.conversation_id).filter(Boolean))]
  if (!conversationIds.length) return []

  const [conversationsResult, membersResult, messagesResult] = await Promise.all([
    supabase.from("conversations").select("id,created_at").in("id", conversationIds),
    supabase.from("conversation_members").select("conversation_id,user_id,joined_at").in("conversation_id", conversationIds),
    supabase.from("messages").select("id,conversation_id,sender_id,message,created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(500),
  ])
  if (conversationsResult.error) throw conversationsResult.error
  if (membersResult.error) throw membersResult.error
  if (messagesResult.error) throw messagesResult.error

  const otherUserIds = [...new Set((membersResult.data ?? []).filter((item) => item.user_id !== user.id).map((item) => item.user_id))]
  const { data: profiles, error: profilesError } = otherUserIds.length
    ? await supabase.from("profiles").select("id,first_name,last_name,avatar_url").in("id", otherUserIds)
    : { data: [], error: null }
  if (profilesError) console.warn("No se pudieron cargar participantes del chat:", profilesError)
  const profileMap = new Map((profiles ?? []).map((item) => [item.id, item]))
  const conversationMap = new Map((conversationsResult.data ?? []).map((item) => [item.id, item]))
  const membersByConversation = new Map()
  for (const member of membersResult.data ?? []) {
    if (!membersByConversation.has(member.conversation_id)) membersByConversation.set(member.conversation_id, [])
    membersByConversation.get(member.conversation_id).push(member)
  }
  const lastMessageByConversation = new Map()
  for (const message of messagesResult.data ?? []) {
    if (!lastMessageByConversation.has(message.conversation_id)) lastMessageByConversation.set(message.conversation_id, message)
  }

  return conversationIds.map((id) => {
    const conversation = conversationMap.get(id)
    if (!conversation) return null
    const otherMember = (membersByConversation.get(id) ?? []).find((item) => item.user_id !== user.id)
    return { id, createdAt: conversation.created_at, otherUser: profileMap.get(otherMember?.user_id) ?? null, lastMessage: lastMessageByConversation.get(id) ?? null }
  }).filter(Boolean).sort((a, b) => new Date(b.lastMessage?.created_at ?? b.createdAt) - new Date(a.lastMessage?.created_at ?? a.createdAt))
}

export async function searchChatUsers(searchTerm) {
  const user = await getAuthenticatedUser()
  const cleanTerm = searchTerm.trim().replace(/[%_,]/g, " ")
  if (cleanTerm.length < 2) return []
  const pattern = `%${cleanTerm}%`
  const { data, error } = await supabase.from("profiles").select("id,first_name,last_name,avatar_url,bio,rating")
    .neq("id", user.id).or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`).order("first_name", { ascending: true }).limit(12)
  if (error) throw error
  return data ?? []
}

export async function getOrCreateDirectConversation(targetUserId) {
  if (!targetUserId) throw new Error("Selecciona un usuario válido.")
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { target_user_id: targetUserId })
  if (error) {
    if (error.code === "42883") throw new Error("Falta configurar el chat en Supabase. Ejecuta el archivo supabase_estabilidad_final.sql.")
    throw error
  }
  return Number(data)
}

export async function getConversationMessages(conversationId) {
  const { data, error } = await supabase.from("messages").select("id,conversation_id,sender_id,message,created_at")
    .eq("conversation_id", Number(conversationId)).order("created_at", { ascending: true })
  if (error) throw error
  return attachSenders(data)
}

export async function sendMessage(conversationId, message) {
  const user = await getAuthenticatedUser()
  const cleanMessage = message.trim()
  if (!cleanMessage) throw new Error("Escribe un mensaje.")
  if (cleanMessage.length > 2000) throw new Error("El mensaje no puede superar los 2000 caracteres.")
  const { data, error } = await supabase.from("messages").insert({ conversation_id: Number(conversationId), sender_id: user.id, message: cleanMessage })
    .select("id,conversation_id,sender_id,message,created_at").single()
  if (error) throw error
  return (await attachSenders([data]))[0]
}

export function subscribeToConversation(conversationId, onNewMessage) {
  if (!conversationId) return () => {}
  const channel = supabase.channel(`conversation-${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${Number(conversationId)}` }, async (payload) => {
    try { const message = await getMessageById(payload.new.id); if (message) onNewMessage(message) }
    catch (error) { console.error("Error cargando mensaje en tiempo real:", error) }
  }).subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToAllMessages(onNewMessage) {
  const channel = supabase.channel("all-user-messages").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
    try { const message = await getMessageById(payload.new.id); if (message) onNewMessage(message) }
    catch (error) { if (error?.code !== "PGRST116") console.error("Error actualizando conversaciones:", error) }
  }).subscribe()
  return () => supabase.removeChannel(channel)
}
