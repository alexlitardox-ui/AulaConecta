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

export async function getNotifications() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      notification_type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      action_url,
      is_read,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data ?? []
}

export async function getUnreadNotificationsCount() {
  const user = await getAuthenticatedUser()

  const { count, error } = await supabase
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) throw error

  return count ?? 0
}

export async function markNotificationAsRead(notificationId) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", Number(notificationId))
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function markAllNotificationsAsRead() {
  const user = await getAuthenticatedUser()

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) throw error
}

export async function deleteNotification(notificationId) {
  const user = await getAuthenticatedUser()

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", Number(notificationId))
    .eq("user_id", user.id)

  if (error) throw error
}

export function subscribeToNotifications(userId, onChange) {
  if (!userId) {
    return () => {}
  }

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onChange()
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}