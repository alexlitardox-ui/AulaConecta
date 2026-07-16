import { supabase } from "./supabase"

const ALLOWED_ENTITY_TYPES = new Set(["material", "request", "group", "profile", "tutoring_session"])
const ALLOWED_REASONS = new Set(["spam", "inappropriate", "misleading", "harassment", "copyright", "other"])

export async function createReport({ entityType, entityId, reason, details = "" }) {
  if (!ALLOWED_ENTITY_TYPES.has(entityType)) throw new Error("Tipo de contenido no válido.")
  if (!entityId) throw new Error("No se pudo identificar el contenido reportado.")
  if (!ALLOWED_REASONS.has(reason)) throw new Error("Selecciona un motivo válido.")

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user) throw new Error("Debes iniciar sesión para reportar contenido.")

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: authData.user.id,
      entity_type: entityType,
      entity_id: String(entityId),
      reason,
      details: details.trim().slice(0, 1000) || null,
    })
    .select("id,status")
    .single()

  if (error?.code === "23505") throw new Error("Ya reportaste este contenido y está pendiente de revisión.")
  if (error) throw error
  return data
}
