# Pruebas automáticas de AulaConecta

## Control obligatorio

```bash
npm run check:all
```

Ejecuta:

- compilación de producción;
- lint;
- verificación del contrato frontend ↔ Supabase;
- verificación de estabilidad y rutas;
- pruebas unitarias con Vitest;
- pruebas HTTP de rutas públicas y redirección SPA;
- auditoría de dependencias de producción.

## Pruebas E2E de navegador

```bash
npx playwright install chromium
npm run check:e2e
```

Estas pruebas abren un navegador real y comprueban:

- página pública;
- inicio de sesión;
- mensaje de enlace de confirmación expirado;
- página 404.

Las pruebas E2E pueden requerir instalar Chromium. La configuración usa `PLAYWRIGHT_CHROMIUM_PATH` cuando se proporciona. En GitHub Actions se recomienda ejecutar `npx playwright install --with-deps chromium`.

## Cobertura unitaria inicial

- Validación de archivos académicos: existencia, extensión, MIME y tamaño.
- Interpretación de errores de confirmación recibidos por query string o fragmento URL.
- Traducción de enlaces expirados a mensajes comprensibles.

## Seguridad de credenciales

Las pruebas con usuarios reales de Supabase deben usar cuentas QA y secretos del entorno. Nunca guardes correos, contraseñas, claves privadas ni `service_role` en el repositorio.
