# Vienna Residencial — Toma de requerimientos (InnovaLab)

**Cliente / proyecto CLA:** Vienna Residencial Módulo 3 — Gestión vecinal y seguimiento de acuerdos  
**MVP:** https://github.com/plataformavienna-cmyk/plataformavienna.git  
**Contexto:** Fraccionamiento en Cd. Juárez / Chihuahua. Sin capturas de sesión aún; evidencia técnica = repo + README + rutas del MVP en ejecución.

## Problema

El comité depende de chats informales (WhatsApp) para quejas, acuerdos y cuotas. Falta un lugar único para reportar conductas, confirmar reincidencias y llevar cuotas por vivienda, con roles distintos (comité / dueño / habitante).

## Alcance del MVP

1. **Auth** — correo/contraseña y Google; membresía por fraccionamiento; pantalla sin acceso.
2. **Incidencias** — reporte vecinal; confirmación por comité; no cuenta reincidencia hasta confirmar.
3. **Reincidentes** — vista de vecinos con historial confirmado (solo administración/comité).
4. **Viviendas y personas** — directorio / habitantes según rol.
5. **Cuotas** — seguimiento; registro de pago por administración.
6. **Roles** — admin/comité vs dueño vs habitante (permisos diferenciados).
7. **Datos** — Supabase (esquema fraccionamientos, usuarios, viviendas, incidencias, cuotas).
8. **Deploy** — monorepo pnpm + SvelteKit; publicación en Vercel.

## Fuera de alcance (por ahora)

- App móvil nativa  
- Integración bancaria de pagos  
- Multifraccionamiento multi-tenant avanzado  

## Evidencia sin fotos de sesión

- README del repo (stack, roles, setup)  
- Rutas: `panel/incidencias`, `reincidentes`, `viviendas`, `personas`, `cuotas`, `auth`  
- `supabase/schema.sql` + `packages/db`
