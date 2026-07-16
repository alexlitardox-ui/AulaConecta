import { supabase } from "./supabase"

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

async function getCurrentUser({ required = false } = {}) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (required && !user) throw new Error("No existe una sesión activa.")

  return user
}

async function fetchSubjectsByIds(ids) {
  const subjectIds = unique(ids.map(Number).filter(Number.isFinite))
  if (subjectIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, code")
    .in("id", subjectIds)

  if (error) {
    console.warn("No se pudieron cargar las materias relacionadas:", error)
    return new Map()
  }

  return new Map((data ?? []).map((subject) => [Number(subject.id), subject]))
}

async function fetchProfilesByIds(ids, fields = "id, first_name, last_name, avatar_url, bio, rating, completed_tutoring") {
  const profileIds = unique(ids)
  if (profileIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from("profiles")
    .select(fields)
    .in("id", profileIds)

  if (error) {
    console.warn("No se pudieron cargar los perfiles relacionados:", error)
    return new Map()
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]))
}

async function enrichRequests(requests) {
  const [subjects, profiles] = await Promise.all([
    fetchSubjectsByIds(requests.map((request) => request.subject_id)),
    fetchProfilesByIds(
      requests.map((request) => request.student_id),
      "id, first_name, last_name, avatar_url",
    ),
  ])

  return requests.map((request) => ({
    ...request,
    subject: subjects.get(Number(request.subject_id)) ?? null,
    student: profiles.get(request.student_id) ?? null,
  }))
}

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
  const user = await getCurrentUser({ required: true })

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
      location_or_link: requestData.locationOrLink.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTutorRequests() {
  const user = await getCurrentUser()

  // Importante: no usamos relaciones incrustadas de PostgREST aquí. En proyectos
  // que han cambiado de esquema, una FK renombrada puede provocar un 400 y tumbar
  // todo el listado aunque las solicitudes sí existan.
  const { data, error } = await supabase
    .from("tutor_requests")
    .select(`
      id,
      student_id,
      subject_id,
      title,
      topic,
      description,
      requested_date,
      start_time,
      end_time,
      modality,
      location_or_link,
      status,
      created_at
    `)
    .in("status", ["open", "with_applications"])
    .order("created_at", { ascending: false })

  if (error) throw error

  const enriched = await enrichRequests(data ?? [])
  return enriched.map((request) => ({
    ...request,
    isOwnRequest: request.student_id === user?.id,
  }))
}

export async function createTutorApplication(requestId, message) {
  const user = await getCurrentUser({ required: true })

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

  return data
}

export async function getMyTutorRequests() {
  const user = await getCurrentUser({ required: true })

  const { data, error } = await supabase
    .from("tutor_requests")
    .select(`
      id,
      student_id,
      subject_id,
      title,
      topic,
      description,
      requested_date,
      start_time,
      end_time,
      modality,
      location_or_link,
      status,
      created_at
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error

  const requests = await enrichRequests(data ?? [])
  if (requests.length === 0) return []

  const requestIds = requests.map((request) => Number(request.id))
  const { data: applications, error: applicationsError } = await supabase
    .from("tutor_applications")
    .select("id, request_id, status")
    .in("request_id", requestIds)

  if (applicationsError) {
    console.warn("No se pudieron cargar las postulaciones de tus solicitudes:", applicationsError)
  }

  const applicationsByRequest = new Map()
  for (const application of applications ?? []) {
    const key = Number(application.request_id)
    const current = applicationsByRequest.get(key) ?? []
    current.push(application)
    applicationsByRequest.set(key, current)
  }

  return requests.map((request) => ({
    ...request,
    applications: applicationsByRequest.get(Number(request.id)) ?? [],
  }))
}

export async function getTutorRequestById(requestId) {
  const user = await getCurrentUser({ required: true })
  const numericRequestId = Number(requestId)

  if (!Number.isFinite(numericRequestId)) {
    throw new Error("El identificador de la solicitud no es válido.")
  }

  const { data: request, error } = await supabase
    .from("tutor_requests")
    .select(`
      id,
      student_id,
      subject_id,
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
      updated_at
    `)
    .eq("id", numericRequestId)
    .maybeSingle()

  if (error) throw error
  if (!request) throw new Error("La solicitud no existe o no tienes permiso para verla.")

  const [subjects, students] = await Promise.all([
    fetchSubjectsByIds([request.subject_id]),
    fetchProfilesByIds([request.student_id]),
  ])

  let applications = []
  const { data: applicationRows, error: applicationsError } = await supabase
    .from("tutor_applications")
    .select("id, request_id, tutor_id, message, status, created_at")
    .eq("request_id", numericRequestId)
    .order("created_at", { ascending: true })

  // Para usuarios que no son dueños, una política RLS puede ocultar postulaciones.
  // Eso no debe impedir que vean la solicitud y puedan postularse.
  if (applicationsError) {
    console.warn("No se pudieron cargar las postulaciones de la solicitud:", applicationsError)
  } else {
    const tutors = await fetchProfilesByIds(
      (applicationRows ?? []).map((application) => application.tutor_id),
    )

    applications = (applicationRows ?? []).map((application) => ({
      ...application,
      tutor: tutors.get(application.tutor_id) ?? null,
    }))
  }

  return {
    ...request,
    subject: subjects.get(Number(request.subject_id)) ?? null,
    student: students.get(request.student_id) ?? null,
    applications,
    isOwnRequest: request.student_id === user.id,
  }
}

export async function cancelTutorRequest(requestId) {
  const user = await getCurrentUser({ required: true })

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
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("La solicitud ya no puede cancelarse o no te pertenece.")

  return data
}

export async function acceptTutorApplication(applicationId) {
  const { data, error } = await supabase.rpc("accept_tutor_application", {
    target_application_id: Number(applicationId),
  })

  if (error) {
    if (error.code === "PGRST202" || error.message?.includes("accept_tutor_application")) {
      throw new Error(
        "Falta configurar la función de aceptación en Supabase. Ejecuta el SQL final del proyecto.",
      )
    }
    throw error
  }

  return data
}

export async function deleteOwnTutorRequest(requestId) {
  const { data, error } = await supabase.rpc("delete_own_tutor_request", {
    target_request_id: Number(requestId),
  })

  if (error) {
    if (error.code === "42883" || error.message?.includes("delete_own_tutor_request")) {
      throw new Error("Falta ejecutar el SQL de eliminación segura en Supabase.")
    }
    throw error
  }

  return data
}
