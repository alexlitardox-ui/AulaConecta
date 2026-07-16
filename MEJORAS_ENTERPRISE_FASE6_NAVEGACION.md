# AulaConecta Enterprise — Fase 6

## Navegación profesional por módulos

Se añadió una navegación consistente dentro de Solicitudes, Materiales y Grupos.

### Solicitudes
- Explorar
- Mis solicitudes
- Nueva solicitud

La gestión y eliminación de solicitudes propias queda disponible directamente desde `Mis solicitudes`, sin depender de la tarjeta del Inicio.

### Materiales
- Explorar
- Mis materiales
- Subir material

### Grupos
- Explorar
- Mis grupos
- Crear grupo

## Mejora técnica

Se creó un componente reutilizable `ModuleTabs` y una configuración centralizada para evitar duplicar estilos y rutas.

## Validación

- Build: OK
- Lint: 0 errores
- Contrato Supabase: OK
- Estabilidad: OK
- Pruebas unitarias: 10/10
- Rutas públicas: OK
- Vulnerabilidades conocidas: 0

## Prueba manual recomendada

1. Abrir Solicitudes desde el menú lateral.
2. Entrar a Mis solicitudes.
3. Comprobar que las solicitudes propias se cargan y pueden eliminarse.
4. Cambiar entre Explorar, Mis solicitudes y Nueva solicitud.
5. Repetir la navegación en Materiales y Grupos.
