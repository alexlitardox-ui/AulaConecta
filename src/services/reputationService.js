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

export async function getMyReviews() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("reviewed_user_id", user.id)
    .order("created_at", {
      ascending: false,
    })

  if (error) throw error

  return data ?? []
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