# Publicar AulaConecta en Netlify

## 1. Subir el proyecto a GitHub

Sube esta carpeta completa a un repositorio. No subas `.env.local`.

## 2. Crear el sitio en Netlify

1. Entra a Netlify y selecciona **Add new project**.
2. Elige **Import an existing project**.
3. Conecta GitHub y selecciona el repositorio de AulaConecta.
4. Configura:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. En **Environment variables**, crea:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Publica el sitio.

Netlify detectará también el archivo `netlify.toml` incluido en el proyecto.

## 3. Configurar Supabase Auth

Cuando Netlify entregue una dirección como:

`https://aulaconecta.netlify.app`

entra a Supabase y abre:

**Authentication → URL Configuration**

Configura:

- Site URL: `https://aulaconecta.netlify.app`
- Additional Redirect URLs:
  - `http://localhost:5173/**`
  - `https://aulaconecta.netlify.app/**`

Si después conectas un dominio propio, agrégalo también como URL permitida.

## 4. Revisar Storage

Confirma que los buckets usados por fotos y materiales existan y que sus políticas RLS permitan las operaciones previstas para usuarios autenticados.

## 5. Probar la versión pública

Prueba en una ventana incógnita:

- Registro y confirmación por correo.
- Inicio y cierre de sesión.
- Recuperación de contraseña.
- Abrir directamente rutas como `/dashboard`, `/dashboard/materiales` y `/dashboard/asistente`.
- Subir y descargar materiales.
- Foto de perfil.
- Chat y notificaciones en tiempo real.

## Seguridad

La clave publicable de Supabase puede utilizarse en el frontend. Nunca coloques la `service_role` key ni secretos administrativos dentro de variables que comiencen con `VITE_`.
