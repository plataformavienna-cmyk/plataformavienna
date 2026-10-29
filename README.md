# Vienna

Registro de conductas para fraccionamientos. Sirve para ubicar vecinos reincidentes —música en la madrugada, basura, estacionamiento— y, aparte, llevar las cuotas del dueño.

Una persona puede rentar una casa sin ser dueña. El dueño tiene su propia cuenta aunque no viva ahí.

## Por qué Postgres

Dueño, habitante, vivienda e incidencia son relaciones. La reincidencia es un conteo por persona y por casa, en 90 días y en un año. Postgres lo resuelve sin armar el vínculo a mano. Esta Mac y Vercel usan la misma base en [Supabase](https://supabase.com).

## Arrancar

En `apps/web/.env` van `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` y `SERVICE_ROLE_KEY`. Ejecuta `supabase/schema.sql` en el editor SQL. Después:

```bash
pnpm install
pnpm dev
```

Abre http://localhost:5173.

`VIENNA_SEED=1` carga las cuentas de demostración solo si el proyecto está vacío. La contraseña es `Demo-2026`. Para verlas en la pantalla de entrada también hace falta `VIENNA_DEMO=1`. Quítalas cuando ya haya vecinos reales. Elena Vargas administra Los Encinos y Bugambilias; Mariana Solís es dueña de Encino 12 y no vive ahí; Diego Herrera renta esa casa.

## Supabase

1. Crea un proyecto.
2. En el editor SQL, ejecuta `supabase/schema.sql` completo.
3. En Authentication → Providers → Google, actívalo. Ahí van el Client ID y el Client Secret de Google Cloud (pantalla de consentimiento externa, y el redirect `https://<ref>.supabase.co/auth/v1/callback`).
4. En Authentication → URL configuration, agrega:
   - `http://localhost:5173/auth/callback`
   - `https://<tu-app>.vercel.app/auth/callback`
5. En `apps/web/.env`:

```
PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon public>
SERVICE_ROLE_KEY=<service_role>
```

El navegador solo usa la URL y la llave anon para entrar con Google. Las consultas las hace el servidor con `SERVICE_ROLE_KEY`, filtrando por el fraccionamiento de la sesión.

Quien entre con Google y no tenga una membresía con ese correo ve una página de espera. Administración lo da de alta en `usuarios` y `membresias` usando ese mismo correo.

## Vercel

El build ya usa `@sveltejs/adapter-vercel`.

1. Importa el repositorio.
2. Root Directory: `apps/web`.
3. Activa «Include source files outside of the Root Directory», porque el código de la base vive en `packages/db`.
4. Variables de entorno: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`.
5. Agrega la URL de producción en las redirecciones de Supabase, como arriba.

## Qué ve cada cuenta

- Administración y comité: incidencias, confirmación, reincidentes, directorio y cuotas. El pago lo registra solo administración.
- Dueño: sus viviendas, quién las habita, las incidencias de esas casas y sus cuotas. No ve el directorio ni quién reportó.
- Habitante: puede reportar y ver el estado de lo que ocurre en su vivienda. No ve teléfonos de otros vecinos ni la lista de reincidentes.

Un reporte no suma como reincidencia hasta que alguien del comité lo confirma y marca a la persona.
