import { supabase } from "./supabase"

async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")
  return user
}

async function hydrateGroups(rows, currentUserId, memberships = []) {
  const groups = rows ?? []
  if (!groups.length) return []
  const subjectIds = [...new Set(groups.map((item) => item.subject_id).filter(Boolean))]
  const creatorIds = [...new Set(groups.map((item) => item.creator_id).filter(Boolean))]
  const groupIds = groups.map((item) => item.id)
  const [subjectsResult, creatorsResult, membersResult] = await Promise.all([
    subjectIds.length ? supabase.from("subjects").select("id,name,code").in("id", subjectIds) : Promise.resolve({ data: [], error: null }),
    creatorIds.length ? supabase.from("profiles").select("id,first_name,last_name,avatar_url").in("id", creatorIds) : Promise.resolve({ data: [], error: null }),
    groupIds.length ? supabase.from("group_members").select("id,group_id,user_id,member_role,status,joined_at").in("group_id", groupIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (subjectsResult.error) console.warn("No se pudieron cargar materias de grupos:", subjectsResult.error)
  if (creatorsResult.error) console.warn("No se pudieron cargar creadores de grupos:", creatorsResult.error)
  if (membersResult.error) console.warn("No se pudieron cargar miembros de grupos:", membersResult.error)
  const subjects = new Map((subjectsResult.data ?? []).map((item) => [item.id, item]))
  const creators = new Map((creatorsResult.data ?? []).map((item) => [item.id, item]))
  const membersByGroup = new Map()
  for (const member of membersResult.data ?? []) {
    if (!membersByGroup.has(member.group_id)) membersByGroup.set(member.group_id, [])
    membersByGroup.get(member.group_id).push(member)
  }
  const ownMemberships = new Map(memberships.map((item) => [item.group_id, item]))
  return groups.map((group) => {
    const members = membersByGroup.get(group.id) ?? []
    const own = ownMemberships.get(group.id) ?? members.find((member) => member.user_id === currentUserId)
    return {
      ...group,
      subject: subjects.get(group.subject_id) ?? null,
      creator: creators.get(group.creator_id) ?? null,
      members,
      memberCount: members.filter((member) => member.status === "accepted").length,
      isCreator: group.creator_id === currentUserId || own?.member_role === "creator",
      isMember: own?.status === "accepted",
      membershipPending: own?.status === "pending",
      memberRole: own?.member_role ?? null,
    }
  })
}

export async function getGroupSubjects() {
  const { data, error } = await supabase.from("subjects").select("id,name,code").eq("is_active", true).order("name")
  if (error) throw error
  return data ?? []
}

export async function createStudyGroup(groupData) {
  const user = await getAuthenticatedUser()
  const { data: group, error: groupError } = await supabase.from("study_groups").insert({
    creator_id: user.id, subject_id: Number(groupData.subjectId), name: groupData.name.trim(),
    description: groupData.description.trim(), meeting_date: groupData.meetingDate,
    start_time: groupData.startTime, end_time: groupData.endTime, modality: groupData.modality,
    location_or_link: groupData.locationOrLink.trim() || null, max_members: Number(groupData.maxMembers),
    access_type: groupData.accessType,
  }).select().single()
  if (groupError) throw groupError
  const { error: memberError } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id, member_role: "creator", status: "accepted" })
  if (memberError) {
    await supabase.from("study_groups").delete().eq("id", group.id).eq("creator_id", user.id)
    throw memberError
  }
  return group
}

export async function getStudyGroups() {
  const user = await getAuthenticatedUser()
  const { data, error } = await supabase.from("study_groups")
    .select("id,creator_id,subject_id,name,description,meeting_date,start_time,end_time,modality,location_or_link,max_members,access_type,status,created_at")
    .in("status", ["active", "full"]).order("created_at", { ascending: false })
  if (error) throw error
  return hydrateGroups(data, user.id)
}

export async function joinStudyGroup(groupId) {
  const { data, error } = await supabase.rpc("join_study_group", { target_group_id: Number(groupId) })
  if (error) {
    if (error.code === "42883" || error.message?.includes("join_study_group")) throw new Error("Falta configurar la función de grupos en Supabase. Ejecuta el SQL final de estabilidad.")
    throw error
  }
  return data
}

export async function getMyStudyGroups() {
  const user = await getAuthenticatedUser()
  const { data: memberships, error } = await supabase.from("group_members")
    .select("id,group_id,user_id,member_role,status,joined_at").eq("user_id", user.id)
    .in("status", ["accepted", "pending"]).order("joined_at", { ascending: false })
  if (error) throw error
  const groupIds = [...new Set((memberships ?? []).map((item) => item.group_id).filter(Boolean))]
  if (!groupIds.length) return []
  const { data: groups, error: groupsError } = await supabase.from("study_groups")
    .select("id,creator_id,subject_id,name,description,meeting_date,start_time,end_time,modality,location_or_link,max_members,access_type,status,created_at")
    .in("id", groupIds)
  if (groupsError) throw groupsError
  const hydrated = await hydrateGroups(groups, user.id, memberships ?? [])
  const order = new Map((memberships ?? []).map((item, index) => [item.group_id, index]))
  return hydrated.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
}

export async function getPendingGroupMembers() {
  const user = await getAuthenticatedUser()
  const { data: ownedGroups, error: groupsError } = await supabase.from("study_groups").select("id,creator_id,name,max_members,status").eq("creator_id", user.id)
  if (groupsError) throw groupsError
  const groupIds = (ownedGroups ?? []).map((item) => item.id)
  if (!groupIds.length) return []
  const { data: memberships, error } = await supabase.from("group_members")
    .select("id,group_id,user_id,status,joined_at").in("group_id", groupIds).eq("status", "pending").order("joined_at", { ascending: true })
  if (error) throw error
  const userIds = [...new Set((memberships ?? []).map((item) => item.user_id).filter(Boolean))]
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from("profiles").select("id,first_name,last_name,avatar_url").in("id", userIds)
    : { data: [], error: null }
  if (profilesError) console.warn("No se pudieron cargar perfiles pendientes:", profilesError)
  const groups = new Map((ownedGroups ?? []).map((item) => [item.id, item]))
  const profileMap = new Map((profiles ?? []).map((item) => [item.id, item]))
  return (memberships ?? []).map((item) => ({ ...item, group: groups.get(item.group_id) ?? null, profile: profileMap.get(item.user_id) ?? null }))
}

export async function updateGroupMembershipStatus(membershipId, newStatus) {
  if (!["accepted", "rejected"].includes(newStatus)) throw new Error("Estado de membresía no válido.")
  const { data, error } = await supabase.rpc("review_group_membership", { target_membership_id: Number(membershipId), target_status: newStatus })
  if (error) {
    if (error.code === "42883" || error.message?.includes("review_group_membership")) throw new Error("Falta actualizar la configuración de grupos en Supabase. Ejecuta el SQL final de estabilidad.")
    throw error
  }
  return data
}

export async function deleteOwnStudyGroup(groupId) {
  const { data, error } = await supabase.rpc("delete_own_study_group", {
    target_group_id: Number(groupId),
  })

  if (error) {
    if (error.code === "42883" || error.message?.includes("delete_own_study_group")) {
      throw new Error("Falta ejecutar el SQL de eliminación segura en Supabase.")
    }
    throw error
  }

  return data
}
