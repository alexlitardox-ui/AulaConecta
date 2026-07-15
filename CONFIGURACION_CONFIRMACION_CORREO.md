# Confirmación de correo

En Supabase > Authentication > URL Configuration:

- Site URL: `https://TU-SITIO.netlify.app`
- Redirect URLs:
  - `https://TU-SITIO.netlify.app/**`
  - `http://localhost:5173/**`

El registro redirige a `/cuenta-confirmada`, donde el usuario recibe una confirmación visual y un botón para iniciar sesión.

Los enlaces antiguos enviados antes de cambiar la configuración pueden continuar apuntando a localhost. Prueba con una cuenta nueva o reenvía la confirmación.
