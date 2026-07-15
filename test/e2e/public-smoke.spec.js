import { expect, test } from "@playwright/test"

test("la página pública carga y muestra AulaConecta", async ({ page }) => {
  await page.goto("/")

  await expect(page).toHaveTitle(/AulaConecta/i)
  await expect(page.getByText("AulaConecta").first()).toBeVisible()
})

test("el inicio de sesión carga sin pantalla en blanco", async ({ page }) => {
  await page.goto("/login")

  await expect(
    page.getByRole("heading", { name: /bienvenido de vuelta/i }),
  ).toBeVisible()

  await expect(
    page.getByRole("button", { name: /iniciar sesión/i }),
  ).toBeVisible()
})

test("un enlace de confirmación expirado muestra un mensaje claro", async ({
  page,
}) => {
  await page.goto(
    "/cuenta-confirmada?error_code=otp_expired&error_description=Token+has+expired",
  )

  await expect(
    page.getByRole("heading", { name: /enlace ya no es válido/i }),
  ).toBeVisible()

  await expect(page.getByText(/expiró o ya fue utilizado/i)).toBeVisible()
})

test("una ruta inexistente muestra la página 404", async ({ page }) => {
  await page.goto("/ruta-que-no-existe")

  await expect(
    page.getByRole("heading", { name: /esta página no existe/i }),
  ).toBeVisible()

  await expect(page.getByText(/error 404/i)).toBeVisible()
})
