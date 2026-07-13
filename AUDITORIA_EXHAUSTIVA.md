# Auditoría exhaustiva de AulaConecta

## Validaciones ejecutadas

- Instalación limpia con `npm ci`.
- Compilación de producción con Vite.
- Análisis estático de todo `src` con Oxlint.
- Auditoría de dependencias de producción con npm.
- Revisión manual de rutas, navegación, autenticación, perfiles, servicios, consultas y operaciones destructivas.
- Revisión de tolerancia a tablas o columnas opcionales.

## Fallos encontrados y corregidos

1. **Ruta incorrecta desde Perfil**
   - El botón de reputación apuntaba a `/dashboard/reputation`.
   - La ruta real es `/dashboard/reputacion`.

2. **Búsqueda de usuarios enviaba a una ruta inexistente**
   - La búsqueda global navegaba a `/dashboard/usuarios/:id`, pero no existía esa pantalla.
   - Se creó una página pública interna de perfil de estudiante, con datos académicos, reputación y reseñas.

3. **Perfiles ausentes después de confirmar el correo**
   - Algunas cuentas podían autenticarse sin una fila válida en `profiles` cuando el trigger de Supabase no se ejecutaba o estaba incompleto.
   - Se añadió `ensureCurrentProfile()`, que recupera o crea de forma segura el perfil desde los metadatos de Auth.

4. **Carga del layout dependía demasiado de `is_admin`**
   - Si la columna todavía no existía, podía fallar la consulta completa del perfil.
   - Se agregó una consulta alternativa sin esa columna.

5. **Código antiguo del Dashboard roto**
   - `useDashboard.js` importaba funciones inexistentes (`getDashboardSummary` y `getRecentRequests`).
   - Se actualizó para usar el servicio real actual.

6. **Dashboard frágil ante una consulta fallida**
   - Una consulta con error podía impedir cargar todas las estadísticas.
   - Ahora cada bloque se resuelve de manera independiente y devuelve valores seguros.

7. **Uso inseguro de `.single()` en actualizaciones**
   - Cancelar solicitudes, actualizar tutorías, procesar miembros o marcar notificaciones podía lanzar error si la fila ya había cambiado o no existía.
   - Se sustituyó por `.maybeSingle()` donde corresponde y se añadieron mensajes claros.

8. **Eliminación de materiales podía perder el archivo antes de confirmar la eliminación de la base**
   - Antes se eliminaba primero Storage y luego el registro.
   - Ahora se elimina primero el registro autorizado y después se limpia Storage; un fallo de Storage solo deja un archivo huérfano, no un registro roto.

9. **Búsqueda global demasiado frágil**
   - Si fallaba una sola categoría, fallaba toda la búsqueda.
   - Ahora usa resultados independientes y sigue mostrando las categorías disponibles.

10. **Valores de reputación engañosos**
    - Algunos lugares mostraban 5.0 cuando todavía no había calificación.
    - Se cambió el valor por defecto a 0.0.

11. **Protecciones ya conservadas de la auditoría anterior**
    - Error Boundary global.
    - Página 404.
    - Recuperación real de contraseña.
    - Rutas con carga diferida.
    - Redirecciones SPA para Netlify.
    - Encabezados de seguridad.

## Resultado final

- `npm run check`: correcto.
- Oxlint: 0 errores y 0 advertencias.
- `npm audit --omit=dev`: 0 vulnerabilidades conocidas.
- Compilación de producción: correcta.

## Límites de esta auditoría

La revisión puede validar por completo el código, la compilación y la consistencia interna. No puede confirmar desde este entorno las políticas RLS, triggers, buckets o funciones RPC de tu proyecto Supabase real porque las credenciales no se incluyeron. Para validar esos puntos se deben probar los flujos con dos cuentas reales y una cuenta administradora.

## Pruebas reales recomendadas antes de publicar

1. Crear una cuenta nueva y confirmar el correo.
2. Verificar que el perfil se cree automáticamente.
3. Buscar otro estudiante y abrir su perfil.
4. Crear solicitud, postular con otra cuenta y aceptar tutor.
5. Actualizar y completar una tutoría.
6. Crear grupo público y privado.
7. Subir, aprobar, descargar, guardar como favorito y eliminar material.
8. Enviar mensajes entre dos cuentas.
9. Recibir y marcar notificaciones.
10. Probar recuperación de contraseña desde el dominio Netlify.
11. Aprobar materiales con la cuenta administradora.
