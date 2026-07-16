# AulaConecta Enterprise — Fase 4

## Centro Analítico ampliado

Se añadieron indicadores administrativos calculados con datos reales:

- crecimiento de usuarios del mes actual frente al anterior;
- porcentaje de tutorías completadas;
- porcentaje de aprobación de materiales revisados;
- cantidad de reportes pendientes;
- horas con mayor actividad;
- tutor mejor valorado;
- material más descargado;
- carrera con más usuarios;
- materia con mayor actividad.

Las consultas secundarias son tolerantes a fallos: si una tabla opcional no puede consultarse, el resto del Centro Analítico continúa disponible.

## Archivos modificados

- `src/services/analyticsService.js`
- `src/pages/Analytics/Analytics.jsx`

## Prueba recomendada

1. Iniciar sesión con la cuenta administradora.
2. Abrir `Dashboard > Analíticas`.
3. Seleccionar `Vista global`.
4. Confirmar que aparezcan los indicadores y gráficos nuevos.
5. Revisar que los estados sin datos muestren mensajes claros y no una pantalla rota.

## Validaciones realizadas

- compilación Vite: correcta;
- lint: 0 errores y 0 advertencias;
- contrato frontend–Supabase: correcto;
- estabilidad de servicios y rutas: correcta;
- pruebas unitarias: 10/10;
- pruebas HTTP de rutas públicas: correctas;
- auditoría de dependencias: 0 vulnerabilidades conocidas.
