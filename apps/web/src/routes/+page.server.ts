import { fail, redirect } from '@sveltejs/kit';
import { crearSesion, listarCuentasDemo, membresiasDe, validarCredenciales } from '@vienna/db';
import { COOKIE, opcionesCookie } from '$lib/server/sesion';
import { googleHabilitado } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.usuario) redirect(303, '/panel');
	if (locals.cuentaSinFraccionamiento) redirect(303, '/sin-acceso');
	return {
		demo: await listarCuentasDemo(),
		google: await googleHabilitado(),
		aviso: url.searchParams.get('aviso')
	};
};

export const actions: Actions = {
	entrar: async ({ request, cookies, url, locals }) => {
		const datos = await request.formData();
		const correo = String(datos.get('correo') ?? '').trim().toLowerCase();
		const password = String(datos.get('password') ?? '');
		if (!correo || !password) {
			return fail(400, { correo, error: 'Escribe correo y contraseña.' });
		}

		if (locals.supabase) {
			const { error } = await locals.supabase.auth.signInWithPassword({ email: correo, password });
			if (error) {
				const aviso =
					error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('confirmado')
						? 'Confirma el correo antes de entrar.'
						: 'Correo o contraseña incorrectos.';
				return fail(400, { correo, error: aviso });
			}
			redirect(303, '/panel');
		}

		const usuario = await validarCredenciales(correo, password);
		if (!usuario) return fail(400, { correo, error: 'Correo o contraseña incorrectos.' });

		const membresias = await membresiasDe(usuario.id);
		if (membresias.length === 0) {
			return fail(400, { correo, error: 'Esta cuenta no está en ningún fraccionamiento.' });
		}

		const token = await crearSesion(usuario.id, membresias[0].fraccionamientoId);
		cookies.set(COOKIE, token, opcionesCookie(url));
		redirect(303, '/panel');
	},

	crear: async ({ request, locals }) => {
		const datos = await request.formData();
		const correo = String(datos.get('correo') ?? '').trim().toLowerCase();
		const password = String(datos.get('password') ?? '');
		const nombre = String(datos.get('nombre') ?? '').trim();
		if (!locals.supabase) {
			return fail(400, { correo, nombre, error: 'Para crear cuenta hace falta Supabase.' });
		}
		if (!nombre) {
			return fail(400, { correo, nombre, error: 'Escribe tu nombre.' });
		}
		if (!correo || password.length < 6) {
			return fail(400, {
				correo,
				nombre,
				error: 'Usa un correo válido y una contraseña de al menos 6 caracteres.'
			});
		}

		const { data, error } = await locals.supabase.auth.signUp({
			email: correo,
			password,
			options: { data: { full_name: nombre, name: nombre } }
		});
		if (error) return fail(400, { correo, nombre, error: error.message });
		if (!data.session) {
			return fail(400, {
				correo,
				nombre,
				error: 'Revisa tu correo para confirmar la cuenta y luego entra.'
			});
		}
		redirect(303, '/panel');
	}
};
