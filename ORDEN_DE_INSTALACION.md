# Orden correcto de instalación

1. Haz una copia de seguridad de la carpeta actual.
2. Usa esta versión como nueva base.
3. Copia tu `.env.local` dentro de la carpeta del proyecto.
4. En Supabase abre **SQL Editor** y ejecuta completo `supabase_integridad_total.sql`.
5. En VS Code ejecuta:

```bash
npm install
npm run check
npm run dev
```

6. Prueba con dos cuentas distintas.
7. Cuando todo funcione localmente, sube esta versión a GitHub y deja que Netlify haga un nuevo deploy.

No vuelvas a ejecutar los SQL antiguos por separado después del SQL integral, porque podrían reintroducir políticas o funciones anteriores.
