# Centro de Soporte y Ayuda — AulaConecta

## 1. Instalar la base de datos

En Supabase abre **SQL Editor → New query** y ejecuta todo el archivo:

`supabase_support_center.sql`

Después ejecuta:

`verificar_centro_soporte.sql`

Todos los objetos deben aparecer con estado `OK` y las tablas deben mostrar RLS activo.

## 2. Probar en local

Copia tu `.env.local` privado en la raíz del proyecto y ejecuta:

```bash
npm install
npm run check:all
npm run dev
```

## 3. Flujo de prueba

### Estudiante

1. Abrir **Soporte y ayuda** desde el menú lateral.
2. Crear un ticket.
3. Revisar que aparezca en la lista.
4. Escribir un mensaje.

### Administrador

1. Abrir **Soporte y ayuda**.
2. Ver todos los tickets.
3. Cambiar prioridad y estado.
4. Responder al estudiante.

### Estudiante nuevamente

1. Ver la notificación recibida.
2. Abrir la respuesta.
3. Cuando el ticket esté resuelto o cerrado, calificar la atención.

## Funciones incluidas

- Tickets privados protegidos con RLS.
- Vista global exclusiva para administradores.
- Conversación dentro del ticket.
- Estados: Pendiente, En proceso, Resuelto y Cerrado.
- Prioridades: Baja, Media y Alta.
- Notificaciones automáticas.
- Calificación de atención de 1 a 5 estrellas.
- Acceso desde el menú lateral y el Dashboard.
