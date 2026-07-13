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

async function hydrateReviewers(rows) {
  const reviews = rows ?? []
  const reviewerIds = [...new Set(reviews.map((item) => item.reviewer_id).filter(Boolean))]
  if (!reviewerIds.length) return reviews.map((item) => ({ ...item, reviewer: null }))
  const { data, error } = await supabase.from("profiles").select("id,first_name,last_name,avatar_url").in("id", reviewerIds)
  if (error) {
    console.warn("No se pudieron cargar autores de reseñas:", error)
    return reviews.map((item) => ({ ...item, reviewer: null }))
  }
  const profiles = new Map((data ?? []).map((item) => [item.id, item]))
  return reviews.map((item) => ({ ...item, reviewer: profiles.get(item.reviewer_id) ?? null }))
}

export async function getMyReviews() {
  const user = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from("reviews")
    .select("id,session_id,reviewer_id,reviewed_user_id,rating,clarity,punctuality,respect,comment,created_at")
    .eq("reviewed_user_id", user.id)
    .order("created_at", { ascending: false })
  if (error) throw error
  return hydrateReviewers(data)
}

export async function getMyRating() {
  const reviews = await getMyReviews()

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
    }
  }

  const average =
    reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    ) / reviews.length

  return {
    average,
    total: reviews.length,
  }
}

export async function getUserReviews(userId) {
  if (!userId) throw new Error("Usuario no válido.")
  const { data, error } = await supabase
    .from("reviews")
    .select("id,session_id,reviewer_id,reviewed_user_id,rating,clarity,punctuality,respect,comment,created_at")
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return hydrateReviewers(data)
}

export async function getUserPublicProfile(userId) {
  if (!userId) throw new Error("Usuario no válido.")

  const decodedUserId = decodeURIComponent(userId)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,avatar_url,bio,rating,completed_tutoring,career_id,semester_id")
    .eq("id", decodedUserId)
    .maybeSingle()

  if (error) throw error
  if (!profile) throw new Error("No encontramos este perfil.")

  const [careerResult, semesterResult] = await Promise.all([
    profile.career_id
      ? supabase.from("careers").select("id,name").eq("id", profile.career_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    profile.semester_id
      ? supabase.from("semesters").select("id,name,level").eq("id", profile.semester_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  return {
    ...profile,
    career: careerResult.error ? null : careerResult.data,
    semester: semesterResult.error ? null : semesterResult.data,
  }
}
