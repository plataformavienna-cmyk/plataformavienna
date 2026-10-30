import { cerrarSesion, crearSesion, leerSesion, membresiasDe, vincularUsuarioGoogle } from '@vienna/db';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { COOKIE, opcionesCookie } from '$lib/server/sesion';
import { crearClienteSupabase, publicarEntorno } from '$lib/server/supabase';

function vaciar(event: RequestEvent) {
	event.locals.token = null;
	event.locals.usuario = null;
	event.locals.fraccionamiento = null;
	event.locals.roles = [];
	event.locals.membresias = [];
	event.locals.supabase = null;
	event.locals.correoGoogle = null;
	event.locals.cuentaSinFraccionamiento = false;
}

function asignar(event: RequestEvent, sesion: NonNullable<Awaited<ReturnType<typeof leerSesion>>>) {
	event.locals.usuario = sesion.usuario;
	event.locals.fraccionamiento = sesion.fraccionamiento;
	event.locals.roles = sesion.roles;
	event.locals.membresias = sesion.membresias;
	event.locals.cuentaSinFraccionamiento = false;
}

async function olvidarCookie(event: RequestEvent) {
	if (!event.locals.token) return;
	await cerrarSesion(event.locals.token);
	event.cookies.delete(COOKIE, { path: '/' });
	event.locals.token = null;
}

async function entrarConCookie(event: RequestEvent) {
	if (!event.locals.token) return;
	const sesion = await leerSesion(event.locals.token);
	if (!sesion) {
		event.cookies.delete(COOKIE, { path: '/' });
		event.locals.token = null;
		return;
	}
	asignar(event, sesion);
}

async function entrarConSupabase(event: RequestEvent) {
	const supabase = event.locals.supabase;
	if (!supabase) return;
	const { data } = await supabase.auth.getUser();
	const authUser = data.user;
	if (!authUser?.email) {
		await entrarConCookie(event);
		return;
	}

	const nombre = String(authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? 'Vecino');
	const vinculado = await vincularUsuarioGoogle({
		supabaseId: authUser.id,
		correo: authUser.email,
		nombre
	});
	event.locals.correoGoogle = vinculado.correo;

	const sesion = event.locals.token ? await leerSesion(event.locals.token) : null;
	if (sesion?.usuario.id === vinculado.id) {
		asignar(event, sesion);
		return;
	}

	await olvidarCookie(event);
	const membresias = await membresiasDe(vinculado.id);
	if (membresias.length === 0) {
		event.locals.cuentaSinFraccionamiento = true;
		return;
	}

	const token = await crearSesion(vinculado.id, membresias[0].fraccionamientoId);
	event.cookies.set(COOKIE, token, opcionesCookie(event.url));
	event.locals.token = token;
	const nueva = await leerSesion(token);
	if (nueva) asignar(event, nueva);
}

export const handle: Handle = async ({ event, resolve }) => {
	publicarEntorno();
	vaciar(event);
	const ruta = event.url.pathname;
	if (ruta.startsWith('/_app/') || ruta.includes('.')) return resolve(event);

	event.locals.token = event.cookies.get(COOKIE) ?? null;
	event.locals.supabase = crearClienteSupabase(event);

	if (event.locals.supabase) await entrarConSupabase(event);
	else await entrarConCookie(event);

	return resolve(event);
};
