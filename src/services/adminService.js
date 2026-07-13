import { supabase } from "./supabase"

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")
  return user
}

export async function getAdminAccess() {
  const user = await requireUser()
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (error) {
    if (error.message?.includes("is_admin")) {
      throw new Error("Falta ejecutar el archivo supabase_admin_setup.sql en Supabase.")
    }
    throw error
  }

  return Boolean(data?.is_admin)
}

export async function getAdminDashboard() {
  const queries = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("tutor_requests").select("id", { count: "exact", head: true }),
    supabase.from("tutoring_sessions").select("id", { count: "exact", head: true }),
    supabase.from("study_groups").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("profiles").select("id, first_name, last_name, avatar_url, rating, created_at, is_admin").order("created_at", { ascending: false }).limit(8),
    supabase.from("materials").select("id, title, material_type, review_status, created_at, author:profiles!materials_user_id_fkey(first_name,last_name), subject:subjects(name,code)").order("created_at", { ascending: false }).limit(8),
  ])

  const firstError = queries.find((result) => result.error)?.error
  if (firstError) throw firstError

  return {
    stats: {
      users: queries[0].count ?? 0,
      requests: queries[1].count ?? 0,
      sessions: queries[2].count ?? 0,
      groups: queries[3].count ?? 0,
      materials: queries[4].count ?? 0,
      pendingMaterials: queries[5].count ?? 0,
    },
    users: queries[6].data ?? [],
    materials: queries[7].data ?? [],
  }
}

export async function reviewMaterial(materialId, reviewStatus) {
  const allowed = ["approved", "rejected", "pending"]
  if (!allowed.includes(reviewStatus)) throw new Error("Estado de revisión no válido.")

  const { data, error } = await supabase
    .from("materials")
    .update({ review_status: reviewStatus })
    .eq("id", materialId)
    .select("id, review_status")
    .single()

  if (error) throw error
  return data
}
