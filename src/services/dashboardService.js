import { supabase } from "./supabase"
import { getAuthenticatedUser } from "./profileService"

function countOrZero(result, label) {
  if (result.error) {
    console.error(`No se pudo cargar ${label}:`, result.error)
    return 0
  }
  return result.count ?? 0
}

export async function getDashboardStats() {
  const user = await getAuthenticatedUser()

  const results = await Promise.allSettled([
    supabase
      .from("tutor_requests")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),
    supabase
      .from("tutoring_sessions")
      .select("id", { count: "exact", head: true })
      .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`),
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "accepted"),
    supabase
      .from("notifications")
      .select("id, notification_type, title, message, action_url, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("rating")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  const resolved = results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { data: null, count: 0, error: result.reason },
  )

  const [requests, tutoring, groups, notifications, profile] = resolved

  return {
    requests: countOrZero(requests, "las solicitudes"),
    tutoring: countOrZero(tutoring, "las tutorías"),
    groups: countOrZero(groups, "los grupos"),
    notifications: notifications.error ? [] : notifications.data ?? [],
    rating: profile.error ? 0 : Number(profile.data?.rating ?? 0),
  }
}
