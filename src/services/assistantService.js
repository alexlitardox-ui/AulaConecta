import { supabase } from "./supabase"

const STOP_WORDS = new Set([
  "a", "al", "algo", "ayuda", "con", "de", "del", "el", "en", "es", "esta",
  "estoy", "grupo", "grupos", "la", "las", "lo", "los", "material", "materiales",
  "me", "mi", "necesito", "para", "por", "que", "quiero", "sobre", "tutor",
  "tutores", "tutoria", "tutorias", "un", "una", "ver",
])

function normalize(value = "") {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function extractKeywords(message) {
  return normalize(message).split(" ").filter((word) => word.length > 2 && !STOP_WORDS.has(word)).slice(0, 8)
}

function scoreText(text, keywords) {
  const normalized = normalize(text)
  return keywords.reduce((score, keyword) => score + (normalized.includes(keyword) ? 1 : 0), 0)
}

function detectIntent(message) {
  const text = normalize(message)
  if (/material|pdf|archivo|apunte|diapositiva|documento/.test(text)) return "materials"
  if (/grupo|estudiar juntos|companeros/.test(text)) return "groups"
  if (/tutor|quien me ayuda|profesor|explica|ensenar/.test(text)) return "tutors"
  if (/solicitud|necesitan ayuda|ayudar a alguien/.test(text)) return "requests"
  return "mixed"
}

async function safeQuery(queryFactory, fallback = []) {
  try {
    const { data, error } = await queryFactory()
    if (error) throw error
    return data ?? fallback
  } catch (error) {
    console.error("Consulta del asistente omitida:", error)
    return fallback
  }
}

async function attachSubjects(rows) {
  const ids = [...new Set((rows ?? []).map((item) => item.subject_id).filter(Boolean))]
  if (!ids.length) return rows ?? []
  const subjects = await safeQuery(() => supabase.from("subjects").select("id,name,code").in("id", ids))
  const map = new Map(subjects.map((item) => [Number(item.id), item]))
  return (rows ?? []).map((item) => ({ ...item, subject: map.get(Number(item.subject_id)) ?? null }))
}

async function attachProfiles(rows, idField, resultField, fields = "id,first_name,last_name,rating") {
  const ids = [...new Set((rows ?? []).map((item) => item[idField]).filter(Boolean))]
  if (!ids.length) return rows ?? []
  const profiles = await safeQuery(() => supabase.from("profiles").select(fields).in("id", ids))
  const map = new Map(profiles.map((item) => [item.id, item]))
  return (rows ?? []).map((item) => ({ ...item, [resultField]: map.get(item[idField]) ?? null }))
}

export async function askAulaConectaAssistant(message) {
  const cleanMessage = message.trim()
  if (cleanMessage.length < 3) throw new Error("Escribe una consulta un poco más específica.")

  const keywords = extractKeywords(cleanMessage)
  const intent = detectIntent(cleanMessage)

  const [materialRows, groupRows, requestRows, tutors] = await Promise.all([
    safeQuery(() => supabase.from("materials")
      .select("id,user_id,subject_id,title,description,material_type,download_count")
      .eq("is_active", true).eq("review_status", "approved")
      .order("download_count", { ascending: false }).limit(40)),
    safeQuery(() => supabase.from("study_groups")
      .select("id,creator_id,subject_id,name,description,meeting_date,start_time,modality,status")
      .in("status", ["active", "full"]).order("meeting_date", { ascending: true }).limit(40)),
    safeQuery(() => supabase.from("tutor_requests")
      .select("id,student_id,subject_id,title,topic,description,requested_date,start_time,modality,status")
      .in("status", ["open", "with_applications"]).order("requested_date", { ascending: true }).limit(40)),
    safeQuery(() => supabase.from("profiles")
      .select("id,first_name,last_name,avatar_url,rating,completed_tutoring,bio")
      .order("rating", { ascending: false }).limit(40)),
  ])

  const [materialsWithSubjects, groupsWithSubjects, requestsWithSubjects] = await Promise.all([
    attachSubjects(materialRows), attachSubjects(groupRows), attachSubjects(requestRows),
  ])
  const [materials, groups, requests] = await Promise.all([
    attachProfiles(materialsWithSubjects, "user_id", "author"),
    attachProfiles(groupsWithSubjects, "creator_id", "creator", "id,first_name,last_name"),
    attachProfiles(requestsWithSubjects, "student_id", "student", "id,first_name,last_name"),
  ])

  function rank(items, getText) {
    return items.map((item) => ({ item, score: scoreText(getText(item), keywords) }))
      .filter(({ score }) => keywords.length === 0 || score > 0)
      .sort((a, b) => b.score - a.score).map(({ item }) => item).slice(0, 4)
  }

  const results = {
    materials: intent === "materials" || intent === "mixed" ? rank(materials, (item) => `${item.title} ${item.description} ${item.subject?.name} ${item.subject?.code}`) : [],
    groups: intent === "groups" || intent === "mixed" ? rank(groups, (item) => `${item.name} ${item.description} ${item.subject?.name} ${item.subject?.code}`) : [],
    requests: intent === "requests" || intent === "mixed" ? rank(requests, (item) => `${item.title} ${item.topic} ${item.description} ${item.subject?.name} ${item.subject?.code}`) : [],
    tutors: intent === "tutors" || intent === "mixed" ? rank(tutors, (item) => `${item.first_name} ${item.last_name} ${item.bio}`) : [],
  }

  const totalResults = Object.values(results).reduce((sum, list) => sum + list.length, 0)
  const topic = keywords.join(" ") || "tu consulta"
  return {
    intent, topic, results, totalResults,
    summary: totalResults > 0
      ? `Encontré ${totalResults} opciones relacionadas con “${topic}” dentro de AulaConecta.`
      : `No encontré coincidencias directas para “${topic}”. Prueba con el nombre de una materia o tema más específico.`,
  }
}
