import { supabase } from "./supabase"

export async function globalSearch(searchTerm) {
  const cleanTerm = searchTerm.trim()

  if (cleanTerm.length < 2) {
    return {
      requests: [],
      groups: [],
      materials: [],
      users: [],
    }
  }

  const pattern = `%${cleanTerm}%`

  const [
    requestsResult,
    groupsResult,
    materialsResult,
    usersResult,
  ] = await Promise.all([
    supabase
      .from("tutor_requests")
      .select(`
        id,
        title,
        topic,
        status,
        subject:subjects (
          name
        )
      `)
      .or(`title.ilike.${pattern},topic.ilike.${pattern}`)
      .in("status", ["open", "with_applications", "accepted"])
      .limit(5),

    supabase
      .from("study_groups")
      .select(`
        id,
        name,
        status,
        subject:subjects (
          name
        )
      `)
      .ilike("name", pattern)
      .in("status", ["active", "full"])
      .limit(5),

    supabase
      .from("materials")
      .select(`
        id,
        title,
        material_type,
        subject:subjects (
          name
        )
      `)
      .ilike("title", pattern)
      .eq("is_active", true)
      .eq("review_status", "approved")
      .limit(5),

    supabase
      .from("profiles")
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        rating,
        bio
      `)
      .or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern}`,
      )
      .limit(5),
  ])

  const errors = [
    requestsResult.error,
    groupsResult.error,
    materialsResult.error,
    usersResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    console.error(errors)
    throw new Error("No se pudo completar la búsqueda.")
  }

  return {
    requests: requestsResult.data ?? [],
    groups: groupsResult.data ?? [],
    materials: materialsResult.data ?? [],
    users: usersResult.data ?? [],
  }
}