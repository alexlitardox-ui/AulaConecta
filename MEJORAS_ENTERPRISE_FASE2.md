# AulaConecta Enterprise — Fase 2

## Gestión profesional de usuarios

Esta fase amplía el panel administrativo con:

- búsqueda de usuarios;
- filtros por rol y estado;
- paginación;
- acceso directo al perfil público;
- cambio de rol;
- suspensión y reactivación de cuentas;
- motivo visible de suspensión;
- métricas de cuentas activas y suspendidas;
- auditoría automática de cada cambio de estado.

## Seguridad aplicada

La suspensión no se limita a ocultar botones. El SQL añade:

- `profiles.account_status`;
- RPC `admin_set_user_status` protegida para administradores;
- impedimento para que un administrador se suspenda a sí mismo;
- trigger de escritura sobre las tablas principales;
- bloqueo visual inmediato en `ProtectedRoute`;
- registro en `audit_logs`.

Una cuenta suspendida que conserve una sesión anterior verá la pantalla de acceso suspendido y sus intentos de escritura serán rechazados por PostgreSQL.

## Instalación

1. Ejecutar `supabase_enterprise_users.sql` en Supabase SQL Editor.
2. Ejecutar `verificar_enterprise_users.sql`.
3. Confirmar que los objetos principales muestran `OK`.
4. Copiar `.env.local` dentro del proyecto.
5. Ejecutar:

```bash
npm install
npm run check
npm run test
npm run dev
```

## Prueba recomendada

1. Iniciar sesión con la cuenta administradora.
2. Entrar en `Dashboard → Administración → Usuarios`.
3. Filtrar por rol y estado.
4. Suspender una cuenta secundaria indicando un motivo.
5. Entrar con esa cuenta en otro navegador.
6. Confirmar que aparezca `Cuenta suspendida`.
7. Reactivarla desde administración.
8. Confirmar la acción en la pestaña Auditoría.
