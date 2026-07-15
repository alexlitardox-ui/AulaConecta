export const MAX_MATERIAL_FILE_SIZE = 6 * 1024 * 1024
export const ALLOWED_MATERIAL_EXTENSIONS = new Set(["pdf","doc","docx","ppt","pptx","xls","xlsx","jpg","jpeg","png"])
export const ALLOWED_MATERIAL_MIME_TYPES = new Set([
  "application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","image/jpeg","image/png","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])
export function validateMaterialFile(file) {
  if (!file) throw new Error("Selecciona un archivo.")
  if (file.size > MAX_MATERIAL_FILE_SIZE) throw new Error("El archivo no puede superar los 6 MB.")
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!ALLOWED_MATERIAL_EXTENSIONS.has(extension) || !ALLOWED_MATERIAL_MIME_TYPES.has(file.type)) {
    throw new Error("Formato no permitido. Utiliza PDF, Word, PowerPoint, Excel, JPG o PNG.")
  }
}
export function sanitizeMaterialFileName(fileName) {
  return fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_")
}
