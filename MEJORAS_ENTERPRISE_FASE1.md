# AulaConecta Enterprise — Fase 1

## Implementado
- Sistema de reportes para materiales, grupos y solicitudes.
- Cola de moderación respaldada por RLS.
- Resolución o descarte de reportes mediante RPC segura.
- Registro automático de la resolución en `audit_logs`.
- Corrección del workflow de GitHub Actions para usar `upload-artifact@v4`.
- El paquete de entrega excluye `.env.local`, `.git`, `node_modules` y `dist`.

## Instalación
1. Ejecutar `supabase_reports_moderation.sql` en Supabase.
2. Ejecutar `verificar_reportes.sql` y confirmar `OK`.
3. Copiar el `.env.local` privado dentro del proyecto.
4. Ejecutar `npm install`, `npm run check:all` y `npm run check:e2e`.
5. Subir a GitHub.
