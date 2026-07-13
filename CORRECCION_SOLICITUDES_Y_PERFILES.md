# Corrección de solicitudes y perfiles públicos

## Cambios de frontend
- El buscador navega a `/dashboard/usuarios/:userId` usando el identificador real del perfil.
- El perfil público abre aunque las reseñas no estén disponibles por RLS.
- Si las relaciones `careers` o `semesters` no están accesibles, se muestra el perfil básico en vez de bloquear la página.
- El detalle de solicitud usa `maybeSingle()` y diferencia entre solicitud inexistente y falta de permisos.
- Si falta la función RPC para aceptar un tutor, la interfaz indica exactamente qué SQL ejecutar.

## Configuración obligatoria en Supabase
Ejecutar `supabase_requests_profiles_fix.sql` desde Supabase > SQL Editor.

El archivo configura:
- Lectura interna de perfiles para usuarios autenticados.
- Creación, lectura y actualización de solicitudes propias.
- Lectura y creación segura de postulaciones.
- Lectura y actualización de tutorías por sus participantes.
- Función atómica `accept_tutor_application` que acepta una postulación, rechaza las demás y crea la sesión de tutoría.

## Validación
- `npm ci`
- `npm run check`
- Resultado: 0 errores y 0 advertencias.
