# AulaConecta

Plataforma académica desarrollada con React, Vite, Tailwind CSS y Supabase.

## Instalación local

1. Copia `.env.example` como `.env.local`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Ejecuta en Supabase el archivo `supabase_estabilidad_final.sql`.
4. Instala y verifica el proyecto:

```bash
npm install
npm run check
npm run dev
```

## Publicación

El proyecto incluye `netlify.toml`. En Netlify utiliza:

- Build command: `npm run build`
- Publish directory: `dist`

Configura las mismas variables de entorno de Supabase en Netlify.

## Verificación

Después del SQL principal, puedes ejecutar `verificar_supabase.sql`. Es una consulta de solo lectura que confirma tablas, funciones y políticas esenciales.
