import { supabase } from "./supabase"

export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")

  return user
}

export async function ensureCurrentProfile() {
  const user = await getAuthenticatedUser()

  let { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, career_id, semester_id, bio, is_admin, role")
    .eq("id", user.id)
    .maybeSingle()

  if (readError?.message?.includes("is_admin")) {
    const fallback = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, career_id, semester_id, bio, role")
      .eq("id", user.id)
      .maybeSingle()
    existingProfile = fallback.data
    readError = fallback.error
  }

  if (readError) throw readError
  if (existingProfile) return existingProfile

  const metadata = user.user_metadata ?? {}
  const profilePayload = {
    id: user.id,
    first_name: String(metadata.first_name ?? user.email?.split("@")[0] ?? "Estudiante").trim(),
    last_name: String(metadata.last_name ?? "").trim(),
    career_id: metadata.career_id ? Number(metadata.career_id) : null,
    semester_id: metadata.semester_id ? Number(metadata.semester_id) : null,
    avatar_url: metadata.avatar_url || null,
  }

  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("id, first_name, last_name, avatar_url, career_id, semester_id, bio")
    .single()

  if (createError) throw createError
  return createdProfile
}
