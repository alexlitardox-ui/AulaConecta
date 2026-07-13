import { supabase } from "./supabase"

async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")
  return user
}

function monthKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function buildLastMonths(count = 6) {
  const formatter = new Intl.DateTimeFormat("es-EC", { month: "short" })
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (count - 1 - index))
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: formatter.format(date).replace(".", ""),
      tutorias: 0,
      solicitudes: 0,
      materiales: 0,
      usuarios: 0,
    }
  })
}

async function safeQuery(query, fallback = []) {
  try {
    const result = await query
    if (result.error) {
      console.warn("Consulta analítica omitida:", result.error.message)
      return fallback
    }
    return result.data ?? fallback
  } catch (error) {
    console.warn("Consulta analítica omitida:", error)
    return fallback
  }
}

async function safeCount(query) {
  try {
    const result = await query
    if (result.error) return 0
    return result.count ?? 0
  } catch {
    return 0
  }
}

export async function getUserAnalytics() {
  const user = await getUser()

  const [sessionRows, requestRows, materialRows, reviewRows, profileRows, favorites] = await Promise.all([
    safeQuery(supabase.from("tutoring_sessions").select("id,status,session_date,created_at,student_id,tutor_id,subject:subjects(name,code)").or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)),
    safeQuery(supabase.from("tutor_requests").select("id,status,created_at,subject:subjects(name,code)").eq("student_id", user.id)),
    safeQuery(supabase.from("materials").select("id,review_status,download_count,created_at,subject:subjects(name,code)").eq("user_id", user.id)),
    safeQuery(supabase.from("reviews").select("rating,created_at").eq("reviewed_user_id", user.id)),
    safeQuery(supabase.from("profiles").select("rating,is_admin").eq("id", user.id).limit(1)),
    safeCount(supabase.from("material_favorites").select("material_id", { count: "exact", head: true }).eq("user_id", user.id)),
  ])

  const profile = profileRows[0] ?? {}
  const monthly = buildLastMonths(6)
  const monthlyMap = new Map(monthly.map(item => [item.key, item]))

  sessionRows.forEach(item => {
    const bucket = monthlyMap.get(monthKey(item.session_date || item.created_at))
    if (bucket) bucket.tutorias += 1
  })
  requestRows.forEach(item => {
    const bucket = monthlyMap.get(monthKey(item.created_at))
    if (bucket) bucket.solicitudes += 1
  })
  materialRows.forEach(item => {
    const bucket = monthlyMap.get(monthKey(item.created_at))
    if (bucket) bucket.materiales += 1
  })

  const subjectMap = new Map()
  ;[...sessionRows, ...requestRows, ...materialRows].forEach(item => {
    const name = item.subject?.name || "Sin materia"
    subjectMap.set(name, (subjectMap.get(name) ?? 0) + 1)
  })

  const averageRating = reviewRows.length
    ? reviewRows.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewRows.length
    : Number(profile.rating || 0)

  return {
    isAdmin: Boolean(profile.is_admin),
    kpis: {
      sessions: sessionRows.length,
      completed: sessionRows.filter(item => item.status === "completed").length,
      materials: materialRows.length,
      downloads: materialRows.reduce((sum, item) => sum + Number(item.download_count || 0), 0),
      favorites,
      rating: averageRating,
      reviews: reviewRows.length,
    },
    monthly,
    subjects: [...subjectMap.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6),
    activity: [
      { name: "Tutorías", value: sessionRows.length },
      { name: "Solicitudes", value: requestRows.length },
      { name: "Materiales", value: materialRows.length },
      { name: "Reseñas", value: reviewRows.length },
    ].filter(item => item.value > 0),
    sessionStatus: [
      { name: "Programadas", value: sessionRows.filter(item => item.status === "scheduled").length },
      { name: "En curso", value: sessionRows.filter(item => item.status === "in_progress").length },
      { name: "Completadas", value: sessionRows.filter(item => item.status === "completed").length },
      { name: "Canceladas", value: sessionRows.filter(item => ["cancelled", "not_completed"].includes(item.status)).length },
    ].filter(item => item.value > 0),
  }
}

export async function getAdminAnalytics() {
  const user = await getUser()
  const profilesCheck = await safeQuery(supabase.from("profiles").select("is_admin").eq("id", user.id).limit(1))
  if (!profilesCheck[0]?.is_admin) return null

  const [profileRows, requestRows, sessionRows, groupRows, materialRows] = await Promise.all([
    safeQuery(supabase.from("profiles").select("id,created_at,career:careers(name)")),
    safeQuery(supabase.from("tutor_requests").select("id,status,created_at,subject:subjects(name)")),
    safeQuery(supabase.from("tutoring_sessions").select("id,status,created_at,session_date,subject:subjects(name)")),
    safeQuery(supabase.from("study_groups").select("id,created_at,subject:subjects(name)")),
    safeQuery(supabase.from("materials").select("id,review_status,download_count,created_at,subject:subjects(name)")),
  ])

  const monthly = buildLastMonths(6)
  const monthlyMap = new Map(monthly.map(item => [item.key, item]))
  profileRows.forEach(item => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.usuarios += 1 })
  requestRows.forEach(item => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.solicitudes += 1 })
  sessionRows.forEach(item => { const b = monthlyMap.get(monthKey(item.session_date || item.created_at)); if (b) b.tutorias += 1 })
  materialRows.forEach(item => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.materiales += 1 })

  const careerMap = new Map()
  profileRows.forEach(item => {
    const name = item.career?.name || "Sin carrera"
    careerMap.set(name, (careerMap.get(name) ?? 0) + 1)
  })

  const subjectMap = new Map()
  ;[...requestRows, ...sessionRows, ...groupRows, ...materialRows].forEach(item => {
    const name = item.subject?.name || "Sin materia"
    subjectMap.set(name, (subjectMap.get(name) ?? 0) + 1)
  })

  return {
    kpis: {
      users: profileRows.length,
      sessions: sessionRows.length,
      completedSessions: sessionRows.filter(item => item.status === "completed").length,
      materials: materialRows.length,
      pendingMaterials: materialRows.filter(item => item.review_status === "pending").length,
      downloads: materialRows.reduce((sum, item) => sum + Number(item.download_count || 0), 0),
    },
    monthly,
    careers: [...careerMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7),
    subjects: [...subjectMap.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 8),
    materialStatus: [
      { name: "Aprobados", value: materialRows.filter(item => item.review_status === "approved").length },
      { name: "Pendientes", value: materialRows.filter(item => item.review_status === "pending").length },
      { name: "Rechazados", value: materialRows.filter(item => item.review_status === "rejected").length },
    ].filter(item => item.value > 0),
  }
}
