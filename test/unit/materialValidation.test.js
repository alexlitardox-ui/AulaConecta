import { describe, expect, it } from "vitest"
import { validateMaterialFile } from "../../src/utils/materialValidation"

function makeFile(name, type, size = 1024) {
  const file = new File([new Uint8Array(Math.min(size, 1024))], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

describe("validateMaterialFile", () => {
  it("acepta un PDF válido", () => {
    expect(() => validateMaterialFile(makeFile("guia.pdf", "application/pdf"))).not.toThrow()
  })

  it("acepta imágenes PNG", () => {
    expect(() => validateMaterialFile(makeFile("grafica.png", "image/png"))).not.toThrow()
  })

  it("rechaza archivos ejecutables", () => {
    expect(() => validateMaterialFile(makeFile("virus.exe", "application/octet-stream"))).toThrow(
      "Formato no permitido",
    )
  })

  it("rechaza extensión válida con MIME incompatible", () => {
    expect(() => validateMaterialFile(makeFile("falso.pdf", "text/javascript"))).toThrow(
      "Formato no permitido",
    )
  })

  it("rechaza archivos mayores de 6 MB", () => {
    expect(() =>
      validateMaterialFile(makeFile("grande.pdf", "application/pdf", 6 * 1024 * 1024 + 1)),
    ).toThrow("6 MB")
  })

  it("requiere seleccionar un archivo", () => {
    expect(() => validateMaterialFile(null)).toThrow("Selecciona un archivo")
  })
})
