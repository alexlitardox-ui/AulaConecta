import { supabase } from "./supabase"

export async function getActiveSubjects() {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name")

  if (error) throw error

  return data ?? []
}

export async function createTutorRequest(requestData) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("No existe una sesión activa.")

  const { data, error } = await supabase
    .from("tutor_requests")
    .insert({
      student_id: user.id,
      subject_id: Number(requestData.subjectId),
      title: requestData.title.trim(),
      topic: requestData.topic.trim(),
      description: requestData.description.trim(),
      requested_date: requestData.requestedDate,
      start_time: requestData.startTime,
      end_time: requestData.endTime,
      modality: requestData.modality,
      location_or_link:
        requestData.locationOrLink.trim() || null,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function getTutorRequests() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError

  const { data, error } = await supabase
    .from("tutor_requests")
    .select(`
      id,
      student_id,
      title,
      topic,
      description,
      requested_date,
      start_time,
      end_time,
      modality,
      location_or_link,
      status,
      created_at,
      subject:subjects (
        id,
        name,
        code
      ),
      student:profiles!tutor_requests_student_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .in("status", ["open", "with_applications"])
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((request) => ({
    ...request,
    isOwnRequest: request.student_id === user?.id,
  }))
}

export async function createTutorApplication(requestId, message) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("No existe una sesión activa.")

  const { data, error } = await supabase
    .from("tutor_applications")
    .insert({
      request_id: Number(requestId),
      tutor_id: user.id,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya te postulaste a esta solicitud.")
    }

    throw error
  }

  const { error: requestError } = await supabase
    .from("tutor_requests")
    .update({
      status: "with_applications",
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(requestId))
    .eq("status", "open")

  if (requestError) {
    console.error(requestError)
  }

  return data
}

export async function getMyTutorRequests() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("No existe una sesión activa.")

  const { data, error } = await supabase
    .from("tutor_requests")
    .select(`
      id,
      title,
      topic,
      description,
      requested_date,
      start_time,
      end_time,
      modality,
      location_or_link,
      status,
      created_at,
      subject:subjects (
        id,
        name,
        code
      ),
      applications:tutor_applications (
        id,
        status
      )
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data ?? []
}

export async function getTutorRequestById(requestId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("No existe una sesión activa.")

  const { data, error } = await supabase
    .from("tutor_requests")
    .select(`
      id,
      student_id,
      title,
      topic,
      description,
      requested_date,
      start_time,
      end_time,
      modality,
      location_or_link,
      status,
      created_at,
      updated_at,
      subject:subjects (
        id,
        name,
        code
      ),
      student:profiles!tutor_requests_student_id_fkey (
        id,
        first_name,
        last_name,
        bio,
        avatar_url,
        rating,
        completed_tutoring
      ),
      applications:tutor_applications (
        id,
        tutor_id,
        message,
        status,
        created_at,
        tutor:profiles!tutor_applications_tutor_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url,
          rating,
          completed_tutoring
        )
      )
    `)
    .eq("id", Number(requestId))
    .single()

  if (error) throw error

  return {
    ...data,
    isOwnRequest: data.student_id === user.id,
  }
}

export async function cancelTutorRequest(requestId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("No existe una sesión activa.")

  const { data, error } = await supabase
    .from("tutor_requests")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(requestId))
    .eq("student_id", user.id)
    .in("status", ["open", "with_applications"])
    .select()
    .single()

  if (error) throw error

  return data
}

export async function acceptTutorApplication(applicationId) {
  const { data, error } = await supabase.rpc(
    "accept_tutor_application",
    {
      target_application_id: Number(applicationId),
    },
  )

  if (error) {
    throw error
  }

  return data
}