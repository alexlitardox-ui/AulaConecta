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

export async function getReviewForSession(sessionId) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      session_id,
      reviewer_id,
      reviewed_user_id,
      rating,
      clarity,
      punctuality,
      respect,
      comment,
      created_at
    `)
    .eq("session_id", Number(sessionId))
    .eq("reviewer_id", user.id)
    .maybeSingle()

  if (error) throw error

  return data
}

export async function createReview({
  session,
  rating,
  clarity,
  punctuality,
  respect,
  comment,
}) {
  const user = await getAuthenticatedUser()

  if (!session) {
    throw new Error("No se encontró la tutoría.")
  }

  if (session.status !== "completed") {
    throw new Error(
      "Solo puedes calificar una tutoría completada.",
    )
  }

  const reviewedUserId =
    session.student_id === user.id
      ? session.tutor_id
      : session.student_id

  if (!reviewedUserId) {
    throw new Error(
      "No se pudo identificar al usuario que será calificado.",
    )
  }

  const values = [
    Number(rating),
    Number(clarity),
    Number(punctuality),
    Number(respect),
  ]

  if (
    values.some(
      (value) =>
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5,
    )
  ) {
    throw new Error(
      "Todas las calificaciones deben estar entre 1 y 5.",
    )
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      session_id: Number(session.id),
      reviewer_id: user.id,
      reviewed_user_id: reviewedUserId,
      rating: Number(rating),
      clarity: Number(clarity),
      punctuality: Number(punctuality),
      respect: Number(respect),
      comment: comment.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Ya calificaste esta tutoría anteriormente.",
      )
    }

    throw error
  }

  return data
}