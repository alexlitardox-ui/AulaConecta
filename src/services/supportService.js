import { supabase } from "./supabase"

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")
  return user
}

export async function getSupportContext() {
  const user = await getCurrentUser()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,role,is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (error) throw error

  return {
    user,
    profile,
    isAdmin: Boolean(profile?.is_admin || profile?.role === "admin"),
  }
}

export async function getSupportTickets({ isAdmin }) {
  let query = supabase
    .from("support_tickets")
    .select(`
      id,
      user_id,
      subject,
      category,
      description,
      priority,
      status,
      assigned_admin,
      satisfaction_rating,
      created_at,
      updated_at,
      resolved_at
    `)
    .order("updated_at", { ascending: false })

  if (!isAdmin) {
    const user = await getCurrentUser()
    query = query.eq("user_id", user.id)
  }

  const { data, error } = await query
  if (error) throw error

  const userIds = [...new Set((data ?? []).flatMap((item) => [item.user_id, item.assigned_admin]).filter(Boolean))]
  let profiles = []

  if (userIds.length) {
    const result = await supabase
      .from("profiles")
      .select("id,first_name,last_name,avatar_url")
      .in("id", userIds)

    if (result.error) throw result.error
    profiles = result.data ?? []
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  return (data ?? []).map((ticket) => ({
    ...ticket,
    user: profileMap.get(ticket.user_id) ?? null,
    admin: profileMap.get(ticket.assigned_admin) ?? null,
  }))
}

export async function getSupportMessages(ticketId) {
  const { data, error } = await supabase
    .from("support_messages")
    .select("id,ticket_id,sender_id,message,created_at")
    .eq("ticket_id", Number(ticketId))
    .order("created_at", { ascending: true })

  if (error) throw error

  const senderIds = [...new Set((data ?? []).map((item) => item.sender_id))]
  let profiles = []

  if (senderIds.length) {
    const result = await supabase
      .from("profiles")
      .select("id,first_name,last_name,role,is_admin,avatar_url")
      .in("id", senderIds)

    if (result.error) throw result.error
    profiles = result.data ?? []
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
  return (data ?? []).map((message) => ({
    ...message,
    sender: profileMap.get(message.sender_id) ?? null,
  }))
}

export async function createSupportTicket(payload) {
  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_subject: payload.subject,
    p_category: payload.category,
    p_description: payload.description,
    p_priority: payload.priority,
  })

  if (error) throw error
  return data
}

export async function addSupportMessage(ticketId, message) {
  const { data, error } = await supabase.rpc("add_support_message", {
    p_ticket_id: Number(ticketId),
    p_message: message,
  })

  if (error) throw error
  return data
}

export async function updateSupportTicket(ticketId, { status, priority, assignedAdmin = null }) {
  const { error } = await supabase.rpc("admin_update_support_ticket", {
    p_ticket_id: Number(ticketId),
    p_status: status,
    p_priority: priority,
    p_assigned_admin: assignedAdmin,
  })

  if (error) throw error
}

export async function rateSupportTicket(ticketId, rating) {
  const { error } = await supabase.rpc("rate_support_ticket", {
    p_ticket_id: Number(ticketId),
    p_rating: Number(rating),
  })

  if (error) throw error
}
