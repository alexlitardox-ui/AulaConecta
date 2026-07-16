# Orden de instalación — Enterprise Fase 2

## 1. Base de datos

Ejecutar en este orden:

1. Los SQL de fases anteriores que aún no se hayan ejecutado.
2. `supabase_reports_moderation.sql`.
3. `supabase_enterprise_users.sql`.

## 2. Verificación

Ejecutar:

- `verificar_reportes.sql`;
- `verificar_enterprise_users.sql`.

## 3. Frontend

Mantener privado el archivo `.env.local` y ejecutar:

```bash
npm install
npm run check
npm run test
npm run dev
```

## 4. Producción

Después de probar localmente:

```bash
git add .
git commit -m "AulaConecta Enterprise fase 2"
git pull --rebase origin main
git push origin main
```

Netlify publicará la nueva versión si el repositorio continúa conectado.
