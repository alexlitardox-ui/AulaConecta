import { supabase } from "./supabase"

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")
  return user
}

function unwrap(result, fallback = []) {
  if (result.status === "rejected" || result.value?.error) {
    console.error("Consulta administrativa omitida:", result.reason ?? result.value?.error)
    return { data: fallback, count: 0 }
  }
  return result.value
}

export async function getAdminAccess() {
  const user = await requireUser()
  const { data, error } = await supabase.from("profiles").select("role,is_admin").eq("id", user.id).maybeSingle()
  if (error) throw error
  return { allowed: Boolean(data?.is_admin || ["admin", "moderator"].includes(data?.role)), role: data?.role ?? (data?.is_admin ? "admin" : "student") }
}

async function hydratePeople(rows, keys) {
  const ids = [...new Set((rows ?? []).flatMap((row) => keys.map((key) => row[key])).filter(Boolean))]
  if (!ids.length) return new Map()
  const { data, error } = await supabase.from("profiles").select("id,first_name,last_name,avatar_url,role,is_admin").in("id", ids)
  if (error) { console.warn("No se pudieron cargar perfiles administrativos:", error); return new Map() }
  return new Map((data ?? []).map((item) => [item.id, item]))
}

export async function getAdminDashboard() {
  const access = await getAdminAccess()
  if (!access.allowed) throw new Error("Tu cuenta no tiene permisos administrativos.")

  const results = await Promise.allSettled([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended"),
    supabase.from("tutor_requests").select("id", { count: "exact", head: true }),
    supabase.from("tutoring_sessions").select("id", { count: "exact", head: true }),
    supabase.from("study_groups").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("profiles").select("id,first_name,last_name,avatar_url,rating,created_at,is_admin,role,account_status,suspended_at,suspension_reason").order("created_at", { ascending: false }).limit(100),
    supabase.from("materials").select("id,user_id,subject_id,title,material_type,review_status,file_path,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("tutor_requests").select("id,student_id,subject_id,title,status,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("study_groups").select("id,creator_id,subject_id,name,status,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("tutoring_sessions").select("id,student_id,tutor_id,subject_id,status,session_date,start_time,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("audit_logs").select("id,actor_id,action,entity_type,entity_id,reason,metadata,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("reports").select("id,reporter_id,entity_type,entity_id,reason,details,status,resolution,resolved_by,resolved_at,created_at").order("created_at", { ascending: false }).limit(100),
  ])

  const [usersCount, activeUsersCount, suspendedUsersCount, requestsCount, sessionsCount, groupsCount, materialsCount, pendingCount, users, materials, requests, groups, sessions, audit, reports] = results.map((r) => unwrap(r))

  const health = {
    authentication: { status: "operational", detail: "Sesión administrativa validada" },
    database: {
      status: results.slice(0, 15).some((result) => result.status === "rejected")
        ? "degraded"
        : "operational",
      detail: results.slice(0, 15).some((result) => result.status === "rejected")
        ? "Una o más consultas no respondieron"
        : "Consultas principales disponibles",
    },
    moderation: {
      status: results[14]?.status === "rejected" ? "degraded" : "operational",
      detail: results[14]?.status === "rejected"
        ? "No se pudo consultar la cola de reportes"
        : "Reportes y moderación disponibles",
    },
    storage: {
      status: results[9]?.status === "rejected" ? "degraded" : "operational",
      detail: results[9]?.status === "rejected"
        ? "No se pudo consultar el catálogo de materiales"
        : "Catálogo de archivos disponible",
    },
  }
  const allRows = [...(materials.data ?? []), ...(requests.data ?? []), ...(groups.data ?? []), ...(sessions.data ?? []), ...(audit.data ?? []), ...(reports.data ?? [])]
  const people = await hydratePeople(allRows, ["user_id", "student_id", "tutor_id", "creator_id", "actor_id", "reporter_id", "resolved_by"])
  const subjectIds = [...new Set([...(materials.data ?? []), ...(requests.data ?? []), ...(groups.data ?? []), ...(sessions.data ?? [])].map((r) => r.subject_id).filter(Boolean))]
  const subjectsResult = subjectIds.length ? await supabase.from("subjects").select("id,name,code").in("id", subjectIds) : { data: [] }
  const subjects = new Map((subjectsResult.data ?? []).map((item) => [item.id, item]))
  const withRelated = (row) => ({ ...row, subject: subjects.get(row.subject_id) ?? null, author: people.get(row.user_id ?? row.student_id ?? row.creator_id) ?? null, student: people.get(row.student_id) ?? null, tutor: people.get(row.tutor_id) ?? null, actor: people.get(row.actor_id) ?? null, reporter: people.get(row.reporter_id) ?? null, resolver: people.get(row.resolved_by) ?? null })

  return {
    role: access.role,
    checkedAt: new Date().toISOString(),
    health,
    stats: { users: usersCount.count ?? 0, activeUsers: activeUsersCount.count ?? 0, suspendedUsers: suspendedUsersCount.count ?? 0, requests: requestsCount.count ?? 0, sessions: sessionsCount.count ?? 0, groups: groupsCount.count ?? 0, materials: materialsCount.count ?? 0, pendingMaterials: pendingCount.count ?? 0, pendingReports: (reports.data ?? []).filter((item) => item.status === "pending").length },
    users: users.data ?? [],
    materials: (materials.data ?? []).map(withRelated),
    requests: (requests.data ?? []).map(withRelated),
    groups: (groups.data ?? []).map(withRelated),
    sessions: (sessions.data ?? []).map(withRelated),
    auditLogs: (audit.data ?? []).map(withRelated),
    reports: (reports.data ?? []).map(withRelated),
  }
}

export async function reviewMaterial(materialId, reviewStatus) {
  if (!["approved", "rejected", "pending"].includes(reviewStatus)) throw new Error("Estado de revisión no válido.")
  const { data, error } = await supabase.from("materials").update({ review_status: reviewStatus }).eq("id", materialId).select("id,review_status").maybeSingle()
  if (error) throw error
  if (!data) throw new Error("El material ya no existe o no tienes permiso para moderarlo.")
  return data
}

export async function setUserRole(userId, role) {
  const { data, error } = await supabase.rpc("admin_set_user_role", { target_user_id: userId, new_role: role })
  if (error) throw error
  return data
}


export async function setUserStatus(userId, status, reason) {
  if (!["active", "suspended"].includes(status)) throw new Error("Estado de cuenta no válido.")
  const { data, error } = await supabase.rpc("admin_set_user_status", {
    target_user_id: userId,
    new_status: status,
    target_reason: reason?.trim() || null,
  })
  if (error) throw error
  return data
}

export async function deleteAdminRequest(id, reason) {
  const { error } = await supabase.rpc("admin_delete_request", { target_id: Number(id), target_reason: reason || null })
  if (error) throw error
}

export async function deleteAdminGroup(id, reason) {
  const { error } = await supabase.rpc("admin_delete_group", { target_id: Number(id), target_reason: reason || null })
  if (error) throw error
}

export async function deleteAdminMaterial(material, reason) {
  const { data: filePath, error } = await supabase.rpc("admin_delete_material", { target_id: Number(material.id), target_reason: reason || null })
  if (error) throw error
  if (filePath) {
    const { error: storageError } = await supabase.storage.from("materials").remove([filePath])
    if (storageError) console.warn("El registro fue eliminado, pero no se pudo retirar el archivo:", storageError)
  }
}

export async function cancelAdminSession(id, reason) {
  const { error } = await supabase.rpc("admin_cancel_session", { target_id: Number(id), target_reason: reason || null })
  if (error) throw error
}

export async function resolveReport(reportId, status, resolution) {
  if (!["resolved", "dismissed"].includes(status)) throw new Error("Estado de reporte no válido.")
  const { data, error } = await supabase.rpc("admin_resolve_report", { target_report_id: Number(reportId), target_status: status, target_resolution: resolution?.trim() || null })
  if (error) throw error
  return data
}
