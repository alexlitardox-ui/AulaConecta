# Panel de Ciberseguridad de AulaConecta

## Qué incluye

- Nueva pestaña **Ciberseguridad** dentro de Administración.
- Acceso visual únicamente para administradores.
- Verificación estricta de administrador también en Supabase RPC.
- Comprobación de CSP, HTTPS, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP y CORP.
- Revisión de directivas CSP esenciales.
- Diagnóstico de tablas públicas sin RLS.
- Diagnóstico de buckets públicos de Storage.
- Conteo de reportes pendientes y cuentas suspendidas.
- Historial de análisis con puntuación de 0 a 100.
- CSP reforzada en `netlify.toml`.

## Instalación

1. Copia los archivos del parche respetando las carpetas. Se reemplazan:
   - `src/pages/Admin/Admin.jsx`
   - `netlify.toml`

   Se agregan:
   - `src/components/Admin/SecurityPanel.jsx`
   - `src/services/securityService.js`
   - `supabase_cybersecurity_panel.sql`
   - `verificar_panel_ciberseguridad.sql`

2. En Supabase abre **SQL Editor → New query** y ejecuta completo:

   `supabase_cybersecurity_panel.sql`

3. Ejecuta después:

   `verificar_panel_ciberseguridad.sql`

   Los tres objetos deben aparecer como `OK` y `security_scan_logs` debe mostrar RLS activo.

4. Comprueba localmente:

   ```bash
   npm install
   npm run check
   npm test
   npm run dev
   ```

5. Entra con una cuenta administradora:

   `Dashboard → Administración → Ciberseguridad`

6. En local aparecerá una advertencia indicando que las cabeceras reales se comprueban en Netlify. Esto es normal.

7. Cuando todo funcione, sube a GitHub para que Netlify aplique la CSP:

   ```bash
   git add .
   git commit -m "Añadir panel de ciberseguridad y reforzar CSP"
   git pull --rebase origin main
   git push origin main
   ```

8. Abre la página pública de Netlify y vuelve a ejecutar el análisis. Ahí deben aparecer las cabeceras HTTP reales.

## Importante

El panel detecta configuraciones débiles y registra análisis. La protección efectiva la proporcionan las cabeceras de Netlify, HTTPS, Supabase RLS, las políticas de Storage y las validaciones. Un panel del frontend no reemplaza un firewall, un WAF ni la protección DDoS del proveedor.
