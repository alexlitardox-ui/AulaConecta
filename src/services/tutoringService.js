import { supabase } from "./supabase"

async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")
  return user
}

export async function getMyTutoringSessions() {
  const user = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from("tutoring_sessions")
    .select("id,student_id,tutor_id,subject_id,session_date,start_time,end_time,modality,location_or_link,notes,status,created_at")
    .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) throw error
  const sessions = data ?? []
  if (!sessions.length) return []

  const subjectIds = [...new Set(sessions.map((item) => item.subject_id).filter(Boolean))]
  const profileIds = [...new Set(sessions.flatMap((item) => [item.student_id, item.tutor_id]).filter(Boolean))]
  const [subjectsResult, profilesResult] = await Promise.all([
    subjectIds.length ? supabase.from("subjects").select("id,name,code").in("id", subjectIds) : Promise.resolve({ data: [], error: null }),
    profileIds.length ? supabase.from("profiles").select("id,first_name,last_name,avatar_url").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (subjectsResult.error) console.warn("No se pudieron cargar materias de tutorías:", subjectsResult.error)
  if (profilesResult.error) console.warn("No se pudieron cargar perfiles de tutorías:", profilesResult.error)
  const subjects = new Map((subjectsResult.data ?? []).map((item) => [item.id, item]))
  const profiles = new Map((profilesResult.data ?? []).map((item) => [item.id, item]))

  return sessions.map((session) => ({
    ...session,
    subject: subjects.get(session.subject_id) ?? null,
    student: profiles.get(session.student_id) ?? null,
    tutor: profiles.get(session.tutor_id) ?? null,
    currentUserRole: session.student_id === user.id ? "student" : "tutor",
  }))
}

export async function updateTutoringStatus(sessionId, status) {
  const allowedStatuses = ["in_progress", "completed", "cancelled", "not_completed"]
  if (!allowedStatuses.includes(status)) throw new Error("Estado de tutoría no válido.")
  const { data, error } = await supabase.rpc("update_tutoring_status", { target_session_id: Number(sessionId), target_status: status })
  if (error) {
    if (error.code === "42883" || error.message?.includes("update_tutoring_status")) {
      throw new Error("Falta actualizar la configuración de tutorías en Supabase. Ejecuta el SQL final de estabilidad.")
    }
    throw error
  }
  return data
}
