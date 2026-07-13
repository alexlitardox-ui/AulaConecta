import { supabase } from "./supabase"

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")

  return user
}

export async function getGroupSubjects() {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name")

  if (error) throw error

  return data ?? []
}

export async function createStudyGroup(groupData) {
  const user = await getAuthenticatedUser()

  const { data: group, error: groupError } = await supabase
    .from("study_groups")
    .insert({
      creator_id: user.id,
      subject_id: Number(groupData.subjectId),
      name: groupData.name.trim(),
      description: groupData.description.trim(),
      meeting_date: groupData.meetingDate,
      start_time: groupData.startTime,
      end_time: groupData.endTime,
      modality: groupData.modality,
      location_or_link:
        groupData.locationOrLink.trim() || null,
      max_members: Number(groupData.maxMembers),
      access_type: groupData.accessType,
    })
    .select()
    .single()

  if (groupError) throw groupError

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      member_role: "creator",
      status: "accepted",
    })

  if (memberError) {
    await supabase
      .from("study_groups")
      .delete()
      .eq("id", group.id)
      .eq("creator_id", user.id)

    throw memberError
  }

  return group
}

export async function getStudyGroups() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("study_groups")
    .select(`
      id,
      creator_id,
      name,
      description,
      meeting_date,
      start_time,
      end_time,
      modality,
      location_or_link,
      max_members,
      access_type,
      status,
      created_at,
      subject:subjects (
        id,
        name,
        code
      ),
      creator:profiles!study_groups_creator_id_fkey (
        id,
        first_name,
        last_name
      ),
      members:group_members (
        id,
        user_id,
        status
      )
    `)
    .in("status", ["active", "full"])
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((group) => {
    const acceptedMembers =
      group.members?.filter(
        (member) => member.status === "accepted",
      ) ?? []

    const currentMembership = group.members?.find(
      (member) => member.user_id === user.id,
    )

    return {
      ...group,
      memberCount: acceptedMembers.length,
      isCreator: group.creator_id === user.id,
      isMember: currentMembership?.status === "accepted",
      membershipPending: currentMembership?.status === "pending",
    }
  })
}

export async function joinStudyGroup(groupId) {
  const { data, error } = await supabase.rpc(
    "join_study_group",
    {
      target_group_id: Number(groupId),
    },
  )

  if (error) throw error

  return data
}

export async function getMyStudyGroups() {
  const user = await getAuthenticatedUser()

  const { data: memberships, error: membershipsError } =
    await supabase
      .from("group_members")
      .select(`
        id,
        member_role,
        status,
        joined_at,
        group:study_groups (
          id,
          creator_id,
          name,
          description,
          meeting_date,
          start_time,
          end_time,
          modality,
          location_or_link,
          max_members,
          access_type,
          status,
          subject:subjects (
            id,
            name,
            code
          ),
          creator:profiles!study_groups_creator_id_fkey (
            id,
            first_name,
            last_name
          ),
          members:group_members (
            id,
            user_id,
            status
          )
        )
      `)
      .eq("user_id", user.id)
      .in("status", ["accepted", "pending"])
      .order("joined_at", { ascending: false })

  if (membershipsError) throw membershipsError

  return (memberships ?? [])
    .filter((membership) => membership.group)
    .map((membership) => {
      const acceptedMembers =
        membership.group.members?.filter(
          (member) => member.status === "accepted",
        ) ?? []

      return {
        ...membership.group,
        memberCount: acceptedMembers.length,
        isCreator: membership.member_role === "creator",
        isMember: membership.status === "accepted",
        membershipPending: membership.status === "pending",
        memberRole: membership.member_role,
      }
    })
}

export async function getPendingGroupMembers() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("group_members")
    .select(`
      id,
      group_id,
      user_id,
      status,
      joined_at,
      group:study_groups!inner (
        id,
        creator_id,
        name,
        max_members,
        status
      ),
      profile:profiles!group_members_user_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("status", "pending")
    .eq("group.creator_id", user.id)
    .order("joined_at", { ascending: true })

  if (error) throw error

  return data ?? []
}

export async function updateGroupMembershipStatus(
  membershipId,
  newStatus,
) {
  const allowedStatuses = ["accepted", "rejected"]

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("Estado de membresía no válido.")
  }

  const { data, error } = await supabase
    .from("group_members")
    .update({
      status: newStatus,
    })
    .eq("id", Number(membershipId))
    .eq("status", "pending")
    .select(`
      id,
      group_id,
      user_id,
      status
    `)
    .single()

  if (error) throw error

  return data
}