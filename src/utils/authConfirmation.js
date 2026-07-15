export const CONFIRMATION_STATUS = {
  VERIFYING: "verifying",
  SUCCESS: "success",
  EXPIRED: "expired",
  ERROR: "error",
}

export function readAuthError(locationLike = window.location) {
  const query = new URLSearchParams(locationLike.search || "")
  const hash = new URLSearchParams((locationLike.hash || "").replace(/^#/, ""))

  return {
    code:
      query.get("error_code") ||
      hash.get("error_code") ||
      query.get("error") ||
      hash.get("error") ||
      "",
    description:
      query.get("error_description") ||
      hash.get("error_description") ||
      query.get("error") ||
      hash.get("error") ||
      "",
  }
}

export function friendlyAuthError(code, description) {
  const normalized = `${code || ""} ${description || ""}`.toLowerCase()

  if (
    normalized.includes("expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("token has expired")
  ) {
    return {
      status: CONFIRMATION_STATUS.EXPIRED,
      message:
        "El enlace de verificación expiró o ya fue utilizado. Solicita un nuevo correo desde el inicio de sesión.",
    }
  }

  return {
    status: CONFIRMATION_STATUS.ERROR,
    message:
      description?.replaceAll("+", " ") ||
      "No se pudo confirmar la cuenta. Intenta nuevamente o solicita otro enlace.",
  }
}
