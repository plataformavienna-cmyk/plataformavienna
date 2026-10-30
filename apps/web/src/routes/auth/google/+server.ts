import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	if (!locals.supabase) {
		redirect(303, `/?aviso=${encodeURIComponent('Google no está configurado en este servidor.')}`);
	}
	const { data, error: fallo } = await locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo: `${url.origin}/auth/callback` }
	});
	if (fallo || !data.url) {
		const aviso = (fallo?.message ?? '').toLowerCase().includes('provider')
			? 'Google no está habilitado en Supabase. Actívalo en Authentication → Providers.'
			: (fallo?.message ?? 'No se pudo abrir Google.');
		redirect(303, `/?aviso=${encodeURIComponent(aviso)}`);
	}
	redirect(303, data.url);
};
