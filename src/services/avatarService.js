import { supabase } from "./supabase"

const BUCKET_NAME = "avatars"
const MAX_FILE_SIZE = 2 * 1024 * 1024

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
]

function sanitizeExtension(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase()

  if (!extension) {
    return "jpg"
  }

  return extension.replace(/[^a-z0-9]/g, "")
}

export async function uploadAvatar(file) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error(
      "No existe una sesión activa. Cierra sesión e inicia nuevamente.",
    )
  }

  if (!file) {
    throw new Error("Selecciona una fotografía.")
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "Formato no permitido. Usa una imagen JPG, PNG o WEBP.",
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("La fotografía no puede superar los 2 MB.")
  }

  const extension = sanitizeExtension(file.name)

  // La primera carpeta debe ser exactamente el ID del usuario.
  const filePath = `${user.id}/avatar-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Error de Storage:", uploadError)
    throw new Error(
      `No se pudo subir la fotografía: ${uploadError.message}`,
    )
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  const publicUrl = publicUrlData.publicUrl

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileError) {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    console.error("Error actualizando perfil:", profileError)

    throw new Error(
      `La fotografía se subió, pero no se pudo actualizar el perfil: ${profileError.message}`,
    )
  }

  await supabase.auth.updateUser({
    data: {
      avatar_url: publicUrl,
    },
  })

  return publicUrl
}