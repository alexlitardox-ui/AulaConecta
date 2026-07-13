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
    .maybeSingle()

  if (error) {
    if (error.message?.includes("is_admin")) {
      throw new Error("Falta ejecutar el archivo supabase_estabilidad_final.sql en Supabase.")
    }
    throw error
  }

  return Boolean(data?.is_admin)
}

export async function getAdminDashboard() {
  const results = await Promise.allSettled([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("tutor_requests").select("id", { count: "exact", head: true }),
    supabase.from("tutoring_sessions").select("id", { count: "exact", head: true }),
    supabase.from("study_groups").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("profiles").select("id, first_name, last_name, avatar_url, rating, created_at, is_admin").order("created_at", { ascending: false }).limit(8),
    supabase.from("materials").select("id,user_id,subject_id,title,material_type,review_status,created_at").eq("review_status", "pending").order("created_at", { ascending: true }).limit(20),
  ])

  const valueAt = (index) => {
    const result = results[index]
    if (result.status === "rejected") {
      console.error("Consulta administrativa omitida:", result.reason)
      return { data: [], count: 0 }
    }
    if (result.value.error) {
      console.error("Consulta administrativa omitida:", result.value.error)
      return { data: [], count: 0 }
    }
    return result.value
  }

  const usersCount = valueAt(0)
  const requestsCount = valueAt(1)
  const sessionsCount = valueAt(2)
  const groupsCount = valueAt(3)
  const materialsCount = valueAt(4)
  const pendingCount = valueAt(5)
  const users = valueAt(6)
  const materials = valueAt(7)

  const pendingMaterials = materials.data ?? []
  const authorIds = [...new Set(pendingMaterials.map((item) => item.user_id).filter(Boolean))]
  const subjectIds = [...new Set(pendingMaterials.map((item) => item.subject_id).filter(Boolean))]
  const [authorsResult, subjectsResult] = await Promise.all([
    authorIds.length ? supabase.from("profiles").select("id,first_name,last_name").in("id", authorIds) : Promise.resolve({ data: [], error: null }),
    subjectIds.length ? supabase.from("subjects").select("id,name,code").in("id", subjectIds) : Promise.resolve({ data: [], error: null }),
  ])
  const authors = new Map((authorsResult.data ?? []).map((item) => [item.id, item]))
  const subjects = new Map((subjectsResult.data ?? []).map((item) => [item.id, item]))

  return {
    stats: {
      users: usersCount.count ?? 0,
      requests: requestsCount.count ?? 0,
      sessions: sessionsCount.count ?? 0,
      groups: groupsCount.count ?? 0,
      materials: materialsCount.count ?? 0,
      pendingMaterials: pendingCount.count ?? 0,
    },
    users: users.data ?? [],
    materials: pendingMaterials.map((item) => ({
      ...item,
      author: authors.get(item.user_id) ?? null,
      subject: subjects.get(item.subject_id) ?? null,
    })),
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
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("El material ya no existe o no tienes permiso para moderarlo.")
  return data
}
