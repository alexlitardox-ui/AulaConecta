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

export async function getMyTutoringSessions() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .select(`
      id,
      student_id,
      tutor_id,
      session_date,
      start_time,
      end_time,
      modality,
      location_or_link,
      notes,
      status,
      created_at,
      subject:subjects (
        id,
        name,
        code
      ),
      student:profiles!tutoring_sessions_student_id_fkey (
        id,
        first_name,
        last_name
      ),
      tutor:profiles!tutoring_sessions_tutor_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) throw error

  return (data ?? []).map((session) => ({
    ...session,
    currentUserRole:
      session.student_id === user.id ? "student" : "tutor",
  }))
}

export async function updateTutoringStatus(sessionId, status) {
  const allowedStatuses = [
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "not_completed",
  ]

  if (!allowedStatuses.includes(status)) {
    throw new Error("Estado de tutoría no válido.")
  }

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(sessionId))
    .select()
    .single()

  if (error) throw error

  return data
}