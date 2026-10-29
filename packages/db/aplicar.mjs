import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = readFileSync(path.join(raiz, 'apps/web/.env'), 'utf8');
const linea = env.split('\n').find((item) => item.startsWith('DATABASE_URL='));
const url = linea?.slice('DATABASE_URL='.length).trim();
if (!url) {
	console.error('Falta DATABASE_URL en apps/web/.env.');
	process.exit(1);
}

const postgres = createRequire(import.meta.url)('postgres');
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });

try {
	const esquema = readFileSync(path.join(raiz, 'supabase/schema.sql'), 'utf8');
	await sql.unsafe(esquema);
	const tablas = await sql`
		select table_name
		from information_schema.tables
		where table_schema = 'public'
		order by table_name
	`;
	console.log(tablas.map((fila) => fila.table_name).join('\n'));
} finally {
	await sql.end({ timeout: 5 });
}
