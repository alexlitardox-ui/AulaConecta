# CAPTCHA y correo de soporte — AulaConecta

Correo oficial configurado en la interfaz: **keyiss18@gmail.com**.

## 1. Crear el CAPTCHA

1. En Cloudflare, abre Turnstile y crea un widget.
2. Agrega tus hostnames de producción y desarrollo.
3. Copia la **Site Key** y la **Secret Key**.

## 2. Configurar Supabase

En Supabase abre:

`Authentication > Bot and Abuse Protection > CAPTCHA protection`

Activa CAPTCHA, selecciona **Cloudflare Turnstile** y pega la **Secret Key**. No guardes esa clave en React, GitHub ni `.env` del frontend.

## 3. Configurar variables

En desarrollo crea `.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_TURNSTILE_SITE_KEY=TU_SITE_KEY_PUBLICA
```

En Netlify agrega `VITE_TURNSTILE_SITE_KEY` en **Site configuration > Environment variables** y vuelve a desplegar.

## 4. Qué se protegió

- Registro de cuentas.
- Inicio de sesión.
- Recuperación de contraseña.
- Validación del token desde Supabase Auth.
- Reinicio del desafío después de cada intento.
- CSP de Netlify compatible con Turnstile.
- Correo de soporte visible en registro, login y footer.

## 5. Ejecutar

```bash
npm install
npm run dev
```

Verificación completa:

```bash
npm run check
```
