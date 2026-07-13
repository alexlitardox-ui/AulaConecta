# Estabilización final de AulaConecta

Esta versión parte de `aulaconecta_moderacion_corregida.zip` y no añade módulos nuevos.

## Correcciones estructurales

- Las tutorías cambian de estado mediante una función segura de Supabase.
- Solo el tutor puede iniciar, completar o marcar una sesión como no realizada.
- Cualquiera de los dos participantes puede cancelar una sesión todavía abierta.
- Un estudiante ya no puede autoaceptar su solicitud de ingreso a un grupo.
- La aceptación y rechazo de miembros valida creador, cupos y estado actual.
- Se elimina cualquier restricción antigua cerrada para tipos de notificación.
- Las conversaciones directas usan bloqueo transaccional para evitar duplicados.
- El panel administrativo tolera fallos parciales sin perder todas las estadísticas.
- Se eliminan políticas RLS antiguas con nombres diferentes antes de crear las definitivas.
- Se habilita lectura de materias, carreras y semestres para usuarios autenticados.
- Se agregan índices para los listados y filtros principales.

## Validación local

- `npm ci`
- `npm run check`
- `npm audit --omit=dev`

Resultado: 0 errores, 0 advertencias y 0 vulnerabilidades conocidas.

## Límite de la validación

La conexión remota, los datos reales y la estructura exacta de la instancia de Supabase solo pueden comprobarse al ejecutar el SQL y realizar pruebas con cuentas reales. El archivo `verificar_supabase.sql` ayuda a confirmar la instalación.
