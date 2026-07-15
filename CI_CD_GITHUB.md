# CI/CD de AulaConecta

El proyecto incluye el workflow `.github/workflows/quality.yml`.

Cada `push` o `pull request` hacia `main` ejecuta automáticamente:

1. Instalación reproducible con `npm ci`.
2. Compilación de producción.
3. Lint y verificaciones de contrato/estabilidad.
4. Pruebas unitarias con Vitest.
5. Pruebas HTTP de rutas.
6. Auditoría de dependencias.
7. Pruebas E2E con Playwright en Chromium.

## Comandos locales

```bash
npm run check:all
npx playwright install chromium
npm run check:e2e
```

## Comando completo

```bash
npm run ci
```

## GitHub

Después de hacer `git push`, entra al repositorio y abre la pestaña **Actions**. El workflow **Calidad AulaConecta** debe quedar en verde antes de publicar.

## Netlify

Netlify seguirá desplegando automáticamente desde `main`. Para evitar publicar código roto, conviene activar la protección de rama en GitHub y exigir que el workflow de calidad termine correctamente antes de fusionar cambios.
