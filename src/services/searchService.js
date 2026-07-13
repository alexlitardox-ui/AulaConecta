import { supabase } from "./supabase"

function dataOrEmpty(result, label) {
  if (result.status === "rejected") {
    console.error(`Búsqueda omitida (${label}):`, result.reason)
    return []
  }
  if (result.value.error) {
    console.error(`Búsqueda omitida (${label}):`, result.value.error)
    return []
  }
  return result.value.data ?? []
}

async function attachSubjects(collections) {
  const allRows = collections.flat()
  const subjectIds = [...new Set(allRows.map((item) => item.subject_id).filter(Boolean))]
  if (!subjectIds.length) return collections

  const { data, error } = await supabase
    .from("subjects")
    .select("id,name,code")
    .in("id", subjectIds)

  if (error) return collections
  const subjectMap = new Map((data ?? []).map((item) => [Number(item.id), item]))
  return collections.map((rows) => rows.map((item) => ({
    ...item,
    subject: subjectMap.get(Number(item.subject_id)) ?? null,
  })))
}

export async function globalSearch(searchTerm) {
  const cleanTerm = searchTerm.trim()
  if (cleanTerm.length < 2) return { requests: [], groups: [], materials: [], users: [] }

  const escapedTerm = cleanTerm.replace(/[%_,]/g, " ").trim()
  if (!escapedTerm) return { requests: [], groups: [], materials: [], users: [] }
  const pattern = `%${escapedTerm}%`

  const results = await Promise.allSettled([
    supabase.from("tutor_requests").select("id,title,topic,status,subject_id")
      .or(`title.ilike.${pattern},topic.ilike.${pattern}`)
      .in("status", ["open", "with_applications", "accepted"]).limit(5),
    supabase.from("study_groups").select("id,name,status,subject_id")
      .ilike("name", pattern).in("status", ["active", "full"]).limit(5),
    supabase.from("materials").select("id,title,material_type,subject_id")
      .ilike("title", pattern).eq("is_active", true).eq("review_status", "approved").limit(5),
    supabase.from("profiles").select("id,first_name,last_name,avatar_url,rating,bio")
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`).limit(5),
  ])

  const baseRequests = dataOrEmpty(results[0], "solicitudes")
  const baseGroups = dataOrEmpty(results[1], "grupos")
  const baseMaterials = dataOrEmpty(results[2], "materiales")
  const [requests, groups, materials] = await attachSubjects([baseRequests, baseGroups, baseMaterials])

  return { requests, groups, materials, users: dataOrEmpty(results[3], "usuarios") }
}
