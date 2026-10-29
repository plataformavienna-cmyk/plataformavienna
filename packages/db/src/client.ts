import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const estado = globalThis as unknown as { viennaSb?: SupabaseClient };

export function getDb() {
	if (!estado.viennaSb) {
		const entorno = process.env;
		const url = entorno['PUBLIC_SUPABASE_URL'];
		const llave = entorno['SERVICE_ROLE_KEY'];
		if (!url || !llave) {
			throw new Error('Faltan PUBLIC_SUPABASE_URL y SERVICE_ROLE_KEY en apps/web/.env.');
		}
		estado.viennaSb = createClient(url, llave, {
			auth: { persistSession: false, autoRefreshToken: false }
		});
	}
	return estado.viennaSb;
}

export function faltanTablas(error: unknown) {
	return error instanceof Error && error.message.startsWith('Faltan las tablas');
}

export function pedir(resultado: { data: unknown; error: { message: string; code?: string } | null }) {
	if (resultado.error) {
		if (resultado.error.code === 'PGRST205') {
			throw new Error('Faltan las tablas. Ejecuta supabase/schema.sql en el editor SQL de Supabase.');
		}
		throw new Error(resultado.error.message);
	}
	return resultado.data as any;
}
