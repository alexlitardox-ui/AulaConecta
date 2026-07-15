# Mejoras implementadas

## Confirmación de correo
- Nueva ruta `/cuenta-confirmada`.
- El registro envía al usuario a esta página después de validar el correo.
- Incluye mensaje de éxito y acceso al login.

## Roles
- `student`: estudiante normal.
- `moderator`: modera materiales y consulta auditoría.
- `admin`: gestiona roles, solicitudes, grupos, tutorías y materiales.
- Los privilegios se comprueban en Supabase; no dependen únicamente de ocultar botones.

## Administración
- Aprobar, rechazar y eliminar materiales.
- Eliminar solicitudes de prueba junto con postulaciones y tutorías relacionadas.
- Eliminar grupos junto con membresías.
- Cancelar tutorías abiertas.
- Cambiar roles de usuarios.
- Consultar registro de auditoría.

## Auditoría
La tabla `audit_logs` registra actor, acción, entidad, motivo, metadatos y fecha.

## Seguridad HTTP
Netlify incluye CSP, X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy, Permissions-Policy y políticas de aislamiento.

## Archivos
Validación simultánea de extensión, MIME y tamaño. Se admiten PDF, Word, PowerPoint, Excel, JPG y PNG hasta 6 MB.
