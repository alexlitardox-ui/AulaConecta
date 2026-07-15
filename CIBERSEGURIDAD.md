# Ciberseguridad de AulaConecta

## Controles implementados

- Autenticación y confirmación de correo mediante Supabase Auth.
- Recuperación segura de contraseña.
- Roles: `student`, `moderator` y `admin`.
- Autorización en base de datos mediante RLS y funciones `SECURITY DEFINER`.
- Auditoría de cambios de rol, eliminaciones y cancelaciones administrativas.
- Mensajes privados visibles únicamente para sus participantes.
- Bucket privado para materiales y URLs de descarga firmadas.
- Validación de extensión, MIME y tamaño máximo de archivos.
- Nombres de archivo saneados y rutas separadas por usuario.
- React escapa por defecto el contenido textual, evitando renderizar HTML introducido por usuarios.
- Cabeceras CSP, X-Frame-Options, nosniff, HSTS, Referrer-Policy y Permissions-Policy en Netlify.
- Dependencias verificadas mediante `npm audit`.

## Cookies y SameSite

AulaConecta no crea cookies propias. Supabase JS mantiene la sesión en almacenamiento del navegador en esta configuración. Si en el futuro se incorpora un backend que establezca cookies, deben utilizar `Secure`, `HttpOnly` y `SameSite=Lax` o `Strict`.

## Roles

- `student`: funciones académicas normales.
- `moderator`: revisión y eliminación de materiales, lectura de auditoría.
- `admin`: gestión total de roles, solicitudes, grupos, tutorías y materiales.

## Consideraciones

La clave pública de Supabase puede estar en el frontend. La protección de los datos depende de RLS, funciones seguras y permisos de Storage; nunca debe exponerse la clave `service_role`.
