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
      tutorias: 0, solicitudes: 0, materiales: 0, usuarios: 0,
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
  } catch { return 0 }
}

async function subjectMapFor(rows) {
  const ids = [...new Set((rows ?? []).map((item) => item.subject_id).filter(Boolean))]
  if (!ids.length) return new Map()
  const subjects = await safeQuery(supabase.from("subjects").select("id,name,code").in("id", ids))
  return new Map(subjects.map((item) => [Number(item.id), item]))
}

async function careerMapFor(rows) {
  const ids = [...new Set((rows ?? []).map((item) => item.career_id).filter(Boolean))]
  if (!ids.length) return new Map()
  const careers = await safeQuery(supabase.from("careers").select("id,name").in("id", ids))
  return new Map(careers.map((item) => [Number(item.id), item]))
}

export async function getUserAnalytics() {
  const user = await getUser()
  const [sessionRows, requestRows, materialRows, reviewRows, profileRows, favorites] = await Promise.all([
    safeQuery(supabase.from("tutoring_sessions").select("id,status,session_date,created_at,student_id,tutor_id,subject_id").or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)),
    safeQuery(supabase.from("tutor_requests").select("id,status,created_at,subject_id").eq("student_id", user.id)),
    safeQuery(supabase.from("materials").select("id,review_status,download_count,created_at,subject_id").eq("user_id", user.id)),
    safeQuery(supabase.from("reviews").select("rating,created_at").eq("reviewed_user_id", user.id)),
    safeQuery(supabase.from("profiles").select("rating,is_admin").eq("id", user.id).limit(1)),
    safeCount(supabase.from("material_favorites").select("material_id", { count: "exact", head: true }).eq("user_id", user.id)),
  ])

  const profile = profileRows[0] ?? {}
  const monthly = buildLastMonths(6)
  const monthlyMap = new Map(monthly.map((item) => [item.key, item]))
  sessionRows.forEach((item) => { const b = monthlyMap.get(monthKey(item.session_date || item.created_at)); if (b) b.tutorias += 1 })
  requestRows.forEach((item) => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.solicitudes += 1 })
  materialRows.forEach((item) => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.materiales += 1 })

  const subjectMap = await subjectMapFor([...sessionRows, ...requestRows, ...materialRows])
  const subjectCounts = new Map()
  ;[...sessionRows, ...requestRows, ...materialRows].forEach((item) => {
    const name = subjectMap.get(Number(item.subject_id))?.name || "Sin materia"
    subjectCounts.set(name, (subjectCounts.get(name) ?? 0) + 1)
  })

  const averageRating = reviewRows.length
    ? reviewRows.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewRows.length
    : Number(profile.rating || 0)

  return {
    isAdmin: Boolean(profile.is_admin),
    kpis: {
      sessions: sessionRows.length,
      completed: sessionRows.filter((item) => item.status === "completed").length,
      materials: materialRows.length,
      downloads: materialRows.reduce((sum, item) => sum + Number(item.download_count || 0), 0),
      favorites, rating: averageRating, reviews: reviewRows.length,
    },
    monthly,
    subjects: [...subjectCounts.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6),
    activity: [
      { name: "Tutorías", value: sessionRows.length },
      { name: "Solicitudes", value: requestRows.length },
      { name: "Materiales", value: materialRows.length },
      { name: "Reseñas", value: reviewRows.length },
    ].filter((item) => item.value > 0),
    sessionStatus: [
      { name: "Programadas", value: sessionRows.filter((item) => item.status === "scheduled").length },
      { name: "En curso", value: sessionRows.filter((item) => item.status === "in_progress").length },
      { name: "Completadas", value: sessionRows.filter((item) => item.status === "completed").length },
      { name: "Canceladas", value: sessionRows.filter((item) => ["cancelled", "not_completed"].includes(item.status)).length },
    ].filter((item) => item.value > 0),
  }
}

export async function getAdminAnalytics() {
  const user = await getUser()
  const profilesCheck = await safeQuery(supabase.from("profiles").select("is_admin").eq("id", user.id).limit(1))
  if (!profilesCheck[0]?.is_admin) return null

  const [profileRows, requestRows, sessionRows, groupRows, materialRows] = await Promise.all([
    safeQuery(supabase.from("profiles").select("id,created_at,career_id,first_name,last_name,rating,role,is_admin")),
    safeQuery(supabase.from("tutor_requests").select("id,status,created_at,subject_id")),
    safeQuery(supabase.from("tutoring_sessions").select("id,status,created_at,session_date,subject_id")),
    safeQuery(supabase.from("study_groups").select("id,created_at,subject_id")),
    safeQuery(supabase.from("materials").select("id,title,user_id,review_status,download_count,created_at,subject_id")),
  ])

  const [reviewRows, reportRows, messageRows] = await Promise.all([
    safeQuery(supabase.from("reviews").select("reviewed_user_id,rating,created_at")),
    safeQuery(supabase.from("reports").select("id,status,created_at")),
    safeQuery(supabase.from("messages").select("id,created_at").order("created_at", { ascending: false }).limit(1000)),
  ])

  const monthly = buildLastMonths(6)
  const monthlyMap = new Map(monthly.map((item) => [item.key, item]))
  profileRows.forEach((item) => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.usuarios += 1 })
  requestRows.forEach((item) => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.solicitudes += 1 })
  sessionRows.forEach((item) => { const b = monthlyMap.get(monthKey(item.session_date || item.created_at)); if (b) b.tutorias += 1 })
  materialRows.forEach((item) => { const b = monthlyMap.get(monthKey(item.created_at)); if (b) b.materiales += 1 })

  const careers = await careerMapFor(profileRows)
  const careerCounts = new Map()
  profileRows.forEach((item) => {
    const name = careers.get(Number(item.career_id))?.name || "Sin carrera"
    careerCounts.set(name, (careerCounts.get(name) ?? 0) + 1)
  })

  const allSubjectRows = [...requestRows, ...sessionRows, ...groupRows, ...materialRows]
  const subjects = await subjectMapFor(allSubjectRows)
  const subjectCounts = new Map()
  allSubjectRows.forEach((item) => {
    const name = subjects.get(Number(item.subject_id))?.name || "Sin materia"
    subjectCounts.set(name, (subjectCounts.get(name) ?? 0) + 1)
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const currentMonthUsers = profileRows.filter((item) => new Date(item.created_at) >= monthStart).length
  const previousMonthUsers = profileRows.filter((item) => {
    const created = new Date(item.created_at)
    return created >= previousMonthStart && created < monthStart
  }).length
  const userGrowth = previousMonthUsers
    ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
    : currentMonthUsers > 0 ? 100 : 0

  const completedSessions = sessionRows.filter((item) => item.status === "completed").length
  const completionRate = sessionRows.length ? (completedSessions / sessionRows.length) * 100 : 0
  const reviewedMaterials = materialRows.filter((item) => ["approved", "rejected"].includes(item.review_status))
  const approvedMaterials = materialRows.filter((item) => item.review_status === "approved").length
  const approvalRate = reviewedMaterials.length ? (approvedMaterials / reviewedMaterials.length) * 100 : 0

  const topMaterial = [...materialRows].sort((a, b) => Number(b.download_count || 0) - Number(a.download_count || 0))[0] ?? null

  const tutorRatings = new Map()
  reviewRows.forEach((item) => {
    if (!item.reviewed_user_id) return
    const entry = tutorRatings.get(item.reviewed_user_id) ?? { sum: 0, count: 0 }
    entry.sum += Number(item.rating || 0)
    entry.count += 1
    tutorRatings.set(item.reviewed_user_id, entry)
  })
  const profileMap = new Map(profileRows.map((item) => [item.id, item]))
  const topTutorEntry = [...tutorRatings.entries()]
    .map(([id, values]) => ({
      id,
      average: values.count ? values.sum / values.count : 0,
      reviews: values.count,
      profile: profileMap.get(id),
    }))
    .filter((item) => item.profile && item.reviews > 0)
    .sort((a, b) => b.average - a.average || b.reviews - a.reviews)[0] ?? null

  const hourCounts = new Map()
  ;[...messageRows, ...requestRows, ...sessionRows, ...materialRows].forEach((item) => {
    const value = item.created_at || item.session_date
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return
    const hour = date.getHours()
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  })
  const peakHours = [...hourCounts.entries()]
    .map(([hour, value]) => ({ name: `${String(hour).padStart(2, "0")}:00`, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const topCareer = [...careerCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null
  const topSubject = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null
  const pendingReports = reportRows.filter((item) => item.status === "pending").length

  return {
    kpis: {
      users: profileRows.length,
      sessions: sessionRows.length,
      completedSessions: sessionRows.filter((item) => item.status === "completed").length,
      materials: materialRows.length,
      pendingMaterials: materialRows.filter((item) => item.review_status === "pending").length,
      downloads: materialRows.reduce((sum, item) => sum + Number(item.download_count || 0), 0),
    },
    monthly,
    careers: [...careerCounts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7),
    subjects: [...subjectCounts.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 8),
    materialStatus: [
      { name: "Aprobados", value: materialRows.filter((item) => item.review_status === "approved").length },
      { name: "Pendientes", value: materialRows.filter((item) => item.review_status === "pending").length },
      { name: "Rechazados", value: materialRows.filter((item) => item.review_status === "rejected").length },
    ].filter((item) => item.value > 0),
    peakHours,
    insights: {
      userGrowth,
      currentMonthUsers,
      previousMonthUsers,
      completionRate,
      approvalRate,
      pendingReports,
      topCareer: topCareer ? { name: topCareer[0], total: topCareer[1] } : null,
      topSubject: topSubject ? { name: topSubject[0], total: topSubject[1] } : null,
      topMaterial: topMaterial
        ? {
            id: topMaterial.id,
            title: topMaterial.title || "Material sin título",
            downloads: Number(topMaterial.download_count || 0),
          }
        : null,
      topTutor: topTutorEntry
        ? {
            id: topTutorEntry.id,
            name:
              `${topTutorEntry.profile.first_name ?? ""} ${topTutorEntry.profile.last_name ?? ""}`.trim() ||
              "Tutor",
            rating: topTutorEntry.average,
            reviews: topTutorEntry.reviews,
          }
        : null,
    },
  }
}
