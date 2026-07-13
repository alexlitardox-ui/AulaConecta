import { supabase } from "./supabase"

const STOP_WORDS = new Set([
  "a", "al", "algo", "ayuda", "con", "de", "del", "el", "en", "es", "esta",
  "estoy", "grupo", "grupos", "la", "las", "lo", "los", "material", "materiales",
  "me", "mi", "necesito", "para", "por", "que", "quiero", "sobre", "tutor",
  "tutores", "tutoria", "tutorias", "un", "una", "ver",
])

function normalize(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractKeywords(message) {
  return normalize(message)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 8)
}

function scoreText(text, keywords) {
  const normalized = normalize(text)
  return keywords.reduce(
    (score, keyword) => score + (normalized.includes(keyword) ? 1 : 0),
    0,
  )
}

function detectIntent(message) {
  const text = normalize(message)

  if (/material|pdf|archivo|apunte|diapositiva|documento/.test(text)) return "materials"
  if (/grupo|estudiar juntos|companeros/.test(text)) return "groups"
  if (/tutor|quien me ayuda|profesor|explica|ensenar/.test(text)) return "tutors"
  if (/solicitud|necesitan ayuda|ayudar a alguien/.test(text)) return "requests"
  if (/recomienda|buscar|encuentra|necesito ayuda|ayuda con/.test(text)) return "mixed"

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

export async function askAulaConectaAssistant(message) {
  const cleanMessage = message.trim()
  if (cleanMessage.length < 3) {
    throw new Error("Escribe una consulta un poco más específica.")
  }

  const keywords = extractKeywords(cleanMessage)
  const intent = detectIntent(cleanMessage)

  const [materials, groups, requests, tutors] = await Promise.all([
    safeQuery(() =>
      supabase
        .from("materials")
        .select(`
          id, title, description, material_type, download_count,
          subject:subjects(id, name, code),
          author:profiles!materials_user_id_fkey(id, first_name, last_name, rating)
        `)
        .eq("is_active", true)
        .eq("review_status", "approved")
        .order("download_count", { ascending: false })
        .limit(40),
    ),
    safeQuery(() =>
      supabase
        .from("study_groups")
        .select(`
          id, name, description, meeting_date, start_time, modality, status,
          subject:subjects(id, name, code),
          creator:profiles!study_groups_creator_id_fkey(id, first_name, last_name)
        `)
        .in("status", ["active", "full"])
        .order("meeting_date", { ascending: true })
        .limit(40),
    ),
    safeQuery(() =>
      supabase
        .from("tutor_requests")
        .select(`
          id, title, topic, description, requested_date, start_time, modality, status,
          subject:subjects(id, name, code),
          student:profiles!tutor_requests_student_id_fkey(id, first_name, last_name)
        `)
        .in("status", ["open", "with_applications"])
        .order("requested_date", { ascending: true })
        .limit(40),
    ),
    safeQuery(() =>
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, rating, completed_tutoring, bio")
        .order("rating", { ascending: false })
        .limit(40),
    ),
  ])

  function rank(items, getText) {
    return items
      .map((item) => ({ item, score: scoreText(getText(item), keywords) }))
      .filter(({ score }) => keywords.length === 0 || score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, 4)
  }

  const rankedMaterials = rank(
    materials,
    (item) => `${item.title} ${item.description} ${item.subject?.name} ${item.subject?.code}`,
  )
  const rankedGroups = rank(
    groups,
    (item) => `${item.name} ${item.description} ${item.subject?.name} ${item.subject?.code}`,
  )
  const rankedRequests = rank(
    requests,
    (item) => `${item.title} ${item.topic} ${item.description} ${item.subject?.name} ${item.subject?.code}`,
  )
  const rankedTutors = rank(
    tutors,
    (item) => `${item.first_name} ${item.last_name} ${item.bio}`,
  )

  const results = {
    materials: intent === "materials" || intent === "mixed" ? rankedMaterials : [],
    groups: intent === "groups" || intent === "mixed" ? rankedGroups : [],
    requests: intent === "requests" || intent === "mixed" ? rankedRequests : [],
    tutors: intent === "tutors" || intent === "mixed" ? rankedTutors : [],
  }

  const totalResults = Object.values(results).reduce((sum, list) => sum + list.length, 0)
  const topic = keywords.join(" ") || "tu consulta"

  return {
    intent,
    topic,
    results,
    summary:
      totalResults > 0
        ? `Encontré ${totalResults} opciones relacionadas con “${topic}” dentro de AulaConecta.`
        : `No encontré coincidencias directas para “${topic}”. Prueba con el nombre de una materia o tema más específico.`,
    totalResults,
  }
}
