import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(15_000);

  page.on("pageerror", (error) => {
    console.error("ERROR DEL NAVEGADOR:", error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error("CONSOLA DEL NAVEGADOR:", message.text());
    }
  });
});

test("la página pública carga y muestra AulaConecta", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(/AulaConecta/i);
  await expect(page.getByText("AulaConecta").first()).toBeVisible();
});

test("el inicio de sesión carga sin pantalla en blanco", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: /bienvenido de vuelta/i }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /iniciar sesión/i }),
  ).toBeVisible();
});

test("un enlace de confirmación expirado muestra un mensaje claro", async ({
  page,
}) => {
  await page.goto(
    "/cuenta-confirmada?error_code=otp_expired&error_description=Token+has+expired",
    { waitUntil: "domcontentloaded" },
  );

  await expect(
    page.getByRole("heading", { name: /enlace ya no es válido/i }),
  ).toBeVisible();

  await expect(page.getByText(/expiró o ya fue utilizado/i)).toBeVisible();
});

test("una ruta inexistente muestra la página 404", async ({ page }) => {
  await page.goto("/ruta-que-no-existe", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: /esta página no existe/i }),
  ).toBeVisible();

  await expect(page.getByText(/error 404/i)).toBeVisible();
});