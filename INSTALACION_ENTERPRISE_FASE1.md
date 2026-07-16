# Instalación de AulaConecta Enterprise — Fase 1

1. Conserva una copia de la versión publicada actual.
2. Copia tu archivo privado `.env.local` dentro de esta carpeta.
3. En Supabase, ejecuta `supabase_reports_moderation.sql`.
4. Ejecuta `verificar_reportes.sql`; ambos objetos deben mostrar `OK`.
5. En Windows, ejecuta:

```cmd
npm install
npm run check:all
npm run check:e2e
```

6. Prueba con dos cuentas:
   - reportar un material, grupo o solicitud;
   - entrar como moderador/administrador;
   - abrir Administración > Reportes;
   - resolver o descartar el reporte;
   - comprobar el registro en Auditoría.
7. Sube la versión a GitHub y verifica Actions y Netlify.

## Seguridad
El ZIP no contiene `.env.local`, `.git`, `node_modules` ni `dist`. Nunca subas la clave `service_role` al frontend o a GitHub.
