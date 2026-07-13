import { supabase } from "./supabase"

const BUCKET_NAME = "materials"
const MAX_FILE_SIZE = 6 * 1024 * 1024

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
]

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error("No existe una sesión activa.")

  return user
}

function sanitizeFileName(fileName) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
}

export function validateMaterialFile(file) {
  if (!file) {
    throw new Error("Selecciona un archivo.")
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("El archivo no puede superar los 6 MB.")
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      "Formato no permitido. Utiliza PDF, Word, PowerPoint, JPG o PNG.",
    )
  }
}

export async function getMaterialSubjects() {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name")

  if (error) throw error

  return data ?? []
}

export async function createMaterial(materialData) {
  const user = await getAuthenticatedUser()
  const file = materialData.file

  validateMaterialFile(file)

  const safeFileName = sanitizeFileName(file.name)
  const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`
  const filePath = `${user.id}/${uniqueFileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data, error: materialError } = await supabase
    .from("materials")
    .insert({
      user_id: user.id,
      subject_id: Number(materialData.subjectId),
      title: materialData.title.trim(),
      description: materialData.description.trim(),
      material_type: materialData.materialType,
      file_path: filePath,
      external_url: null,
      original_file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    })
    .select()
    .single()

  if (materialError) {
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
    throw materialError
  }

  return data
}

export async function getMaterials() {
  const { data, error } = await supabase
    .from("materials")
    .select(`
      id,
      user_id,
      title,
      description,
      material_type,
      file_path,
      external_url,
      original_file_name,
      mime_type,
      file_size,
      download_count,
      created_at,
      subject:subjects (
        id,
        name,
        code
      ),
      author:profiles!materials_user_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("is_active", true)
    .eq("review_status", "approved")
    .order("created_at", { ascending: false })

  if (error) throw error

  return data ?? []
}

export async function getMyMaterials() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("materials")
    .select(`
      id,
      user_id,
      title,
      description,
      material_type,
      file_path,
      original_file_name,
      mime_type,
      file_size,
      download_count,
      review_status,
      is_active,
      created_at,
      subject:subjects (
        id,
        name,
        code
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data ?? []
}

export async function getMaterialDownloadUrl(filePath) {
  if (!filePath) {
    throw new Error("El material no tiene un archivo asociado.")
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 60, {
      download: true,
    })

  if (error) throw error

  return data.signedUrl
}

export async function deleteMaterial(material) {
  const user = await getAuthenticatedUser()

  if (material.user_id !== user.id) {
    throw new Error("No tienes permiso para eliminar este material.")
  }

  if (material.file_path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([material.file_path])

    if (storageError) throw storageError
  }

  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", material.id)
    .eq("user_id", user.id)

  if (error) throw error
}

export async function getFavoriteMaterialIds() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("material_favorites")
    .select("material_id")
    .eq("user_id", user.id)

  if (error) throw error

  return new Set((data ?? []).map((item) => item.material_id))
}

export async function addMaterialFavorite(materialId) {
  const user = await getAuthenticatedUser()

  const { error } = await supabase
    .from("material_favorites")
    .upsert(
      { user_id: user.id, material_id: materialId },
      { onConflict: "user_id,material_id", ignoreDuplicates: true },
    )

  if (error) throw error
}

export async function removeMaterialFavorite(materialId) {
  const user = await getAuthenticatedUser()

  const { error } = await supabase
    .from("material_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("material_id", materialId)

  if (error) throw error
}

export async function getFavoriteMaterials() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from("material_favorites")
    .select(`
      material_id,
      created_at,
      material:materials!material_favorites_material_id_fkey (
        id,
        user_id,
        title,
        description,
        material_type,
        file_path,
        external_url,
        original_file_name,
        mime_type,
        file_size,
        download_count,
        created_at,
        is_active,
        review_status,
        subject:subjects (
          id,
          name,
          code
        ),
        author:profiles!materials_user_id_fkey (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? [])
    .map((item) => item.material)
    .filter(
      (material) =>
        material && material.is_active && material.review_status === "approved",
    )
}
