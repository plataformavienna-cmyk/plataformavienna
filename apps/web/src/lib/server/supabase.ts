import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env as privado } from '$env/dynamic/private';
import { env } from '$env/dynamic/public';
import type { RequestEvent } from '@sveltejs/kit';

function esLlaveSecreta(llave: string) {
	try {
		const datos = JSON.parse(Buffer.from(llave.split('.')[1], 'base64url').toString()) as { role?: string };
		return datos.role === 'service_role';
	} catch {
		return false;
	}
}

export function publicarEntorno() {
	if (env.PUBLIC_SUPABASE_URL) process.env.PUBLIC_SUPABASE_URL = env.PUBLIC_SUPABASE_URL;
	if (env.PUBLIC_SUPABASE_ANON_KEY) process.env.PUBLIC_SUPABASE_ANON_KEY = env.PUBLIC_SUPABASE_ANON_KEY;
	if (privado.SERVICE_ROLE_KEY) process.env.SERVICE_ROLE_KEY = privado.SERVICE_ROLE_KEY;
}

export function googleConfigurado() {
	return Boolean(env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY);
}

export async function googleHabilitado() {
	const url = env.PUBLIC_SUPABASE_URL;
	const llave = env.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !llave || esLlaveSecreta(llave)) return false;
	try {
		const respuesta = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: llave } });
		if (!respuesta.ok) return false;
		const datos = (await respuesta.json()) as { external?: { google?: boolean } };
		return Boolean(datos.external?.google);
	} catch {
		return false;
	}
}

export function crearClienteSupabase(event: RequestEvent) {
	const url = env.PUBLIC_SUPABASE_URL;
	const llave = env.PUBLIC_SUPABASE_ANON_KEY;
	if (llave && esLlaveSecreta(llave)) {
		throw new Error('PUBLIC_SUPABASE_ANON_KEY es la llave secreta service_role. En apps/web/.env va la llave anon.');
	}
	if (!url || !llave) return null;

	return createServerClient(url, llave, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookies) {
				for (const { name, value, options } of cookies) {
					event.cookies.set(name, value, {
						...(options as CookieOptions),
						path: '/',
						secure: event.url.protocol === 'https:'
					});
				}
			}
		}
	});
}
