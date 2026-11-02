# Vienna

Registro de conductas para fraccionamientos. Ubica vecinos reincidentes (música en la madrugada, basura, estacionamiento) y, aparte, lleva las cuotas del dueño. Quien renta y quien es dueño tienen cuentas distintas.

**Repo:** https://github.com/plataformavienna-cmyk/plataformavienna.git

Stack: monorepo **pnpm** + **SvelteKit** (`apps/web`) + **Supabase** (`packages/db`). Node **22+**.

---

## 1. Bajar el proyecto

```bash
git clone https://github.com/plataformavienna-cmyk/plataformavienna.git
cd plataformavienna
```

### Abrirlo en el editor

| Herramienta | Cómo |
|-------------|------|
| **Cursor** | `File → Open Folder` → carpeta `plataformavienna`. O en la terminal: `cursor .` |
| **VS Code** | `File → Open Folder` → misma carpeta. O: `code .` |
| **Claude Code** | Entra a la carpeta del repo y abre la sesión ahí (`cd plataformavienna` antes de lanzar Claude). El contexto del agente debe ser la raíz del monorepo, no solo `apps/web`. |

No abras solo `apps/web` como raíz del workspace: faltan `packages/db` y el `pnpm-workspace.yaml`.

---

## 2. Requisitos en la máquina

1. **Node.js 22 o mayor** (`node -v`).
2. **pnpm 11** (el repo declara `packageManager`):

```bash
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm -v
```

---

## 3. Instalar dependencias

En la **raíz** del repo:

```bash
pnpm install
```

---

## 4. Variables de entorno

```bash
cp apps/web/.env.example apps/web/.env
```

Edita `apps/web/.env` (Project Settings → API en Supabase):

```env
PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon public>
SERVICE_ROLE_KEY=<service_role>
```

- `PUBLIC_*` las usa el navegador (Google / Auth).
- `SERVICE_ROLE_KEY` **solo el servidor**. No le pongas el prefijo `PUBLIC_`.
- `DATABASE_URL` (opcional): solo para crear/actualizar tablas con `pnpm db:aplicar`. Es la conexión directa, puerto **5432**. Si la contraseña tiene `@`, `"`, `}`, etc., codifícala en la URL.

No subas `.env` a git (ya está en `.gitignore`).

---

## 5. Tablas en Supabase

Si el proyecto aún no tiene el esquema:

1. Pega y ejecuta `supabase/schema.sql` en el **SQL Editor** de Supabase, **o**
2. Con `DATABASE_URL` en el `.env`:

```bash
pnpm db:aplicar
```

Eso crea fraccionamientos, usuarios, viviendas, incidencias, cuotas, etc., y el disparador de Google.

---

## 6. Arrancar en local

```bash
pnpm dev
```

Abre **http://localhost:5173**.

Comandos útiles:

```bash
pnpm check          # tipos / svelte-check
pnpm build          # build de producción (adaptador Vercel)
pnpm db:aplicar     # aplica supabase/schema.sql
```

### Auth

- **Correo:** pestaña Entrar (correo + contraseña) o Crear cuenta (nombre + correo + contraseña).
- **Google:** solo aparece si en Supabase → Authentication → Providers → Google está **Enable**. Redirects:
  - `http://localhost:5173/auth/callback`
  - `https://<tu-app>.vercel.app/auth/callback`
- Sin membresía en un fraccionamiento, la cuenta llega a una pantalla de espera. Hay que darla de alta en `usuarios` / `membresias` con ese correo.

### Datos de demostración (opcional)

Solo en un proyecto vacío, en `.env`:

```env
VIENNA_SEED=1
VIENNA_DEMO=1
```

Contraseña de demo: `Demo-2026`. Quítalas en producción.

---

## 7. Continuar con un agente (Cursor / Claude Code)

Pistas cortas para el agente:

- Raíz del monorepo = este README.
- App: `apps/web` (SvelteKit 2 + Svelte 5 + Tailwind 4).
- Datos: `packages/db` (cliente Supabase con `SERVICE_ROLE_KEY`).
- Esquema SQL: `supabase/schema.sql`.
- Plantilla de env: `apps/web/.env.example`.
- UI en español (México). No commits ni push salvo que lo pidan.
- No pegues secretos del `.env` en el chat ni en el README.

---

## 8. Publicar en Vercel

1. Importa `plataformavienna-cmyk/plataformavienna`.
2. **Root Directory:** `apps/web`.
3. Activa *Include source files outside of the Root Directory* (hace falta `packages/db`).
4. Env: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`.
5. Suma el dominio de Vercel en las URL de Auth de Supabase.

---

## Qué ve cada rol

- **Administración / comité:** incidencias, confirmación, reincidentes, directorio y cuotas (el pago lo registra administración).
- **Dueño:** sus viviendas, habitantes, incidencias de esas casas y cuotas. No ve el directorio ni quién reportó.
- **Habitante:** reporta y ve lo de su vivienda. No ve teléfonos ajenos ni reincidentes.

Un reporte no cuenta como reincidencia hasta que el comité lo confirma y marca a la persona.
