import { randomBytes } from 'node:crypto';
import { PASSWORD_DEMO, verificarContrasena } from './auth';
import { faltanTablas, getDb, pedir } from './client';
import { comoRol, type FraccionamientoSesion, type MembresiaSesion, type Rol, type Sesion } from './tipos';

const DIAS_SESION = 14;
const DESTACADAS = ['usr-elena', 'usr-luis', 'usr-mariana', 'usr-diego'];

type UsuarioFila = { id: string; nombre: string; correo: string; hash_contrasena: string | null };
type MembresiaFila = {
	rol: string;
	fraccionamientos: { id: string; nombre: string; ciudad: string; estado: string };
};

export async function validarCredenciales(correo: string, contrasena: string) {
	const sb = getDb();
	const usuario = pedir(
		await sb.from('usuarios').select('id, nombre, correo, hash_contrasena').eq('correo', correo.trim().toLowerCase()).maybeSingle()
	) as UsuarioFila | null;
	if (!usuario?.hash_contrasena) return null;
	const valida = await verificarContrasena(contrasena, usuario.hash_contrasena);
	if (!valida) return null;
	return { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
}

export async function membresiasDe(usuarioId: string): Promise<MembresiaSesion[]> {
	const sb = getDb();
	const filas = pedir(
		await sb
			.from('membresias')
			.select('rol, fraccionamientos!inner(id, nombre, ciudad, estado)')
			.eq('usuario_id', usuarioId)
	) as MembresiaFila[];

	const grupos = new Map<string, MembresiaSesion>();
	for (const fila of filas) {
		const rol = comoRol(fila.rol);
		if (!rol) continue;
		const fra = fila.fraccionamientos;
		const actual = grupos.get(fra.id);
		if (actual) {
			actual.roles.push(rol);
			continue;
		}
		grupos.set(fra.id, {
			fraccionamientoId: fra.id,
			nombre: fra.nombre,
			ciudad: fra.ciudad,
			estado: fra.estado,
			roles: [rol]
		});
	}
	return [...grupos.values()];
}

export async function crearSesion(usuarioId: string, fraccionamientoId: string) {
	const sb = getDb();
	const token = randomBytes(32).toString('hex');
	const expiraEn = new Date(Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000).toISOString();
	pedir(
		await sb.from('sesiones').insert({ token, usuario_id: usuarioId, fraccionamiento_id: fraccionamientoId, expira_en: expiraEn })
	);
	return token;
}

export async function cerrarSesion(token: string) {
	const sb = getDb();
	try {
		pedir(await sb.from('sesiones').delete().eq('token', token));
	} catch (error) {
		if (!faltanTablas(error)) throw error;
	}
}

export async function cambiarFraccionamiento(token: string, usuarioId: string, fraccionamientoId: string) {
	const membresiasUsuario = await membresiasDe(usuarioId);
	const destino = membresiasUsuario.find((item) => item.fraccionamientoId === fraccionamientoId);
	if (!destino) return false;
	const sb = getDb();
	pedir(await sb.from('sesiones').update({ fraccionamiento_id: fraccionamientoId }).eq('token', token));
	return true;
}

export async function leerSesion(token: string): Promise<Sesion | null> {
	const sb = getDb();
	const sesion = pedir(
		await sb.from('sesiones').select('token, usuario_id, fraccionamiento_id, expira_en').eq('token', token).maybeSingle()
	) as { usuario_id: string; fraccionamiento_id: string; expira_en: string } | null;
	if (!sesion) return null;
	if (new Date(sesion.expira_en).getTime() < Date.now()) {
		await cerrarSesion(token);
		return null;
	}

	const usuario = pedir(
		await sb.from('usuarios').select('id, nombre, correo').eq('id', sesion.usuario_id).maybeSingle()
	) as { id: string; nombre: string; correo: string } | null;
	if (!usuario) return null;

	const lista = await membresiasDe(usuario.id);
	if (lista.length === 0) {
		await cerrarSesion(token);
		return null;
	}

	let actual = lista.find((item) => item.fraccionamientoId === sesion.fraccionamiento_id);
	if (!actual) {
		actual = lista[0];
		pedir(await sb.from('sesiones').update({ fraccionamiento_id: actual.fraccionamientoId }).eq('token', token));
	}

	const fraccionamiento: FraccionamientoSesion = {
		id: actual.fraccionamientoId,
		nombre: actual.nombre,
		ciudad: actual.ciudad,
		estado: actual.estado
	};

	return {
		usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
		fraccionamiento,
		roles: actual.roles,
		membresias: lista
	};
}

export async function listarCuentasDemo() {
	if (process.env.VIENNA_DEMO === '0') return null;
	const sb = getDb();
	let filas: Array<{
		id: string;
		nombre: string;
		correo: string;
		membresias: Array<{ rol: string; fraccionamientos: { nombre: string } }>;
	}>;
	try {
		filas = pedir(
		await sb
			.from('usuarios')
			.select('id, nombre, correo, membresias(rol, fraccionamientos!inner(nombre))')
			.like('correo', '%@vienna.local')
		);
	} catch (error) {
		if (faltanTablas(error)) return null;
		throw error;
	}

	const cuentas = new Map<string, { id: string; nombre: string; correo: string; fraccionamientos: { nombre: string; roles: Rol[] }[] }>();
	for (const fila of filas) {
		for (const membresia of fila.membresias ?? []) {
			const rol = comoRol(membresia.rol);
			if (!rol) continue;
			let cuenta = cuentas.get(fila.id);
			if (!cuenta) {
				cuenta = { id: fila.id, nombre: fila.nombre, correo: fila.correo, fraccionamientos: [] };
				cuentas.set(fila.id, cuenta);
			}
			let grupo = cuenta.fraccionamientos.find((item) => item.nombre === membresia.fraccionamientos.nombre);
			if (!grupo) {
				grupo = { nombre: membresia.fraccionamientos.nombre, roles: [] };
				cuenta.fraccionamientos.push(grupo);
			}
			grupo.roles.push(rol);
		}
	}

	const todas = [...cuentas.values()];
	if (todas.length === 0) return null;
	const destacadas = DESTACADAS.map((id) => todas.find((cuenta) => cuenta.id === id)).filter((cuenta) => cuenta != null);
	const otras = todas.filter((cuenta) => !DESTACADAS.includes(cuenta.id)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
	return { password: PASSWORD_DEMO, destacadas, otras };
}

export async function vincularUsuarioGoogle(datos: { supabaseId: string; correo: string; nombre: string }) {
	const sb = getDb();
	const correo = datos.correo.trim().toLowerCase();
	const nombre = datos.nombre.trim() || 'Vecino';

	const porIdentidad = pedir(
		await sb.from('usuarios').select('id, nombre, correo').eq('supabase_id', datos.supabaseId).maybeSingle()
	) as { id: string; nombre: string; correo: string } | null;
	if (porIdentidad) return porIdentidad;

	const porCorreo = pedir(
		await sb.from('usuarios').select('id, nombre, correo').eq('correo', correo).maybeSingle()
	) as { id: string; nombre: string; correo: string } | null;
	if (porCorreo) {
		pedir(await sb.from('usuarios').update({ supabase_id: datos.supabaseId }).eq('id', porCorreo.id));
		return porCorreo;
	}

	pedir(
		await sb.from('usuarios').insert({
			id: datos.supabaseId,
			nombre,
			correo,
			telefono: null,
			hash_contrasena: null,
			supabase_id: datos.supabaseId
		})
	);
	return { id: datos.supabaseId, nombre, correo };
}
