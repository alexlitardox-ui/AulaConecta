import { supabase } from "./supabase"

async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getDashboardStats() {
  const user = await getUser()

  const [
    requests,
    tutoring,
    groups,
    notifications,
    profile,
  ] = await Promise.all([
    supabase
      .from("tutor_requests")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("student_id", user.id),

    supabase
      .from("tutoring_sessions")
      .select("*", {
        count: "exact",
        head: true,
      })
      .or(
        `student_id.eq.${user.id},tutor_id.eq.${user.id}`,
      ),

    supabase
      .from("group_members")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("status", "accepted"),

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("profiles")
      .select("rating")
      .eq("id", user.id)
      .single(),
  ])

  return {
    requests: requests.count || 0,
    tutoring: tutoring.count || 0,
    groups: groups.count || 0,
    notifications: notifications.data || [],
    rating: profile.data?.rating || 5,
  }
}