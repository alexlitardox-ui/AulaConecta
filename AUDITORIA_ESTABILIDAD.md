# Auditoría de estabilidad — AulaConecta

Base revisada: versión posterior a la corrección del error 400 de Solicitudes.

## Validaciones automáticas ejecutadas

- `npm ci`
- `npm run check`
- `npm audit --omit=dev`
- Compilación de producción con Vite
- Lint de `src`
- Contrato estático frontend ↔ Supabase

## Correcciones aplicadas

- Solicitudes: carga principal y relaciones por consultas separadas.
- Grupos: materias, creadores y miembros cargados por separado.
- Mis grupos: membresías y grupos cargados sin relaciones incrustadas.
- Solicitudes de ingreso a grupos: perfiles y grupos hidratados por separado.
- Chat: conversaciones, miembros, perfiles y mensajes cargados por consultas separadas.
- Mensajes: remitentes cargados después del mensaje, evitando errores por claves foráneas nombradas distinto.
- Tutorías: materias, estudiante y tutor cargados por separado.
- Materiales: materias y autores cargados por separado.
- Reputación: autores de reseñas cargados por separado.
- Administración: materiales pendientes, autores y materias cargados por separado.

## Resultado

- Compilación: correcta.
- Lint: 0 errores y 0 advertencias.
- Contrato frontend ↔ Supabase: correcto.
- Auditoría de dependencias: 0 vulnerabilidades conocidas.

## Límite de la revisión local

La revisión local no puede simular las políticas RLS, datos y sesión de tu proyecto remoto sin conectarse a tu Supabase. Por ello, antes de presentar deben probarse con dos cuentas reales: solicitud/postulación/aceptación, chat, grupo privado, tutoría y material.
