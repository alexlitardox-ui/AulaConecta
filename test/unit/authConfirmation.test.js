import { describe, expect, it } from "vitest"
import {
  CONFIRMATION_STATUS,
  friendlyAuthError,
  readAuthError,
} from "../../src/utils/authConfirmation"

describe("confirmación de correo", () => {
  it("detecta errores incluidos en query string", () => {
    expect(
      readAuthError({ search: "?error_code=otp_expired&error_description=Token+expired", hash: "" }),
    ).toEqual({ code: "otp_expired", description: "Token expired" })
  })

  it("detecta errores incluidos en el hash", () => {
    expect(
      readAuthError({ search: "", hash: "#error=access_denied&error_description=Denied" }),
    ).toEqual({ code: "access_denied", description: "Denied" })
  })

  it("traduce enlaces expirados a un estado específico", () => {
    const result = friendlyAuthError("otp_expired", "Token has expired")
    expect(result.status).toBe(CONFIRMATION_STATUS.EXPIRED)
    expect(result.message).toContain("expiró")
  })

  it("conserva una descripción útil para errores generales", () => {
    const result = friendlyAuthError("access_denied", "Acceso+denegado")
    expect(result.status).toBe(CONFIRMATION_STATUS.ERROR)
    expect(result.message).toBe("Acceso denegado")
  })
})
