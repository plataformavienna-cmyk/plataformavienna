import { randomUUID } from 'node:crypto';
import { getDb, pedir } from './client';
import { clasificarReincidencia, direccion, esComite, hoyMexico, type Rol, type Vinculos } from './tipos';

function numero(valor: unknown) {
	return Number(valor ?? 0);
}

function hace(dias: number) {
	return Date.now() - dias * 24 * 60 * 60 * 1000;
}

type IncidenciaBase = {
	id: string;
	vivienda_id: string;
	estado: string;
	ocurrio_en: string;
	categoria?: string;
	implicados?: Array<{ usuario_id: string }>;
};

async function incidenciasDelFraccionamiento(fraId: string) {
	const sb = getDb();
	return pedir(
		await sb.from('incidencias').select('id, vivienda_id, estado, ocurrio_en, categoria, implicados(usuario_id)').eq('fraccionamiento_id', fraId)
	) as IncidenciaBase[];
}

function conteoPersonas(filas: IncidenciaBase[]) {
	const mapa = new Map<string, { id: string; en90: number; en365: number }>();
	const limite90 = hace(90);
	const limite365 = hace(365);
	for (const fila of filas) {
		if (fila.estado !== 'confirmada') continue;
		const cuando = new Date(fila.ocurrio_en).getTime();
		for (const implicado of fila.implicados ?? []) {
			const actual = mapa.get(implicado.usuario_id) ?? { id: implicado.usuario_id, en90: 0, en365: 0 };
			if (cuando >= limite365) actual.en365 += 1;
			if (cuando >= limite90) actual.en90 += 1;
			mapa.set(implicado.usuario_id, actual);
		}
	}
	return [...mapa.values()];
}

function conteoViviendas(filas: IncidenciaBase[]) {
	const mapa = new Map<string, { id: string; en365: number; abiertas: number }>();
	const limite365 = hace(365);
	for (const fila of filas) {
		const actual = mapa.get(fila.vivienda_id) ?? { id: fila.vivienda_id, en365: 0, abiertas: 0 };
		if (fila.estado === 'reportada' || fila.estado === 'en_revision') actual.abiertas += 1;
		if (fila.estado === 'confirmada' && new Date(fila.ocurrio_en).getTime() >= limite365) actual.en365 += 1;
		mapa.set(fila.vivienda_id, actual);
	}
	return [...mapa.values()];
}

export async function vinculosDeUsuario(fraId: string, usuarioId: string): Promise<Vinculos> {
	const sb = getDb();
	const titulares = pedir(
		await sb
			.from('titularidades')
			.select('vivienda_id, viviendas!inner(fraccionamiento_id)')
			.eq('usuario_id', usuarioId)
			.is('hasta', null)
			.eq('viviendas.fraccionamiento_id', fraId)
	) as Array<{ vivienda_id: string }>;
	const habitadas = pedir(
		await sb
			.from('ocupaciones')
			.select('vivienda_id, viviendas!inner(fraccionamiento_id)')
			.eq('usuario_id', usuarioId)
			.is('hasta', null)
			.eq('viviendas.fraccionamiento_id', fraId)
	) as Array<{ vivienda_id: string }>;
	return {
		titulares: titulares.map((fila) => fila.vivienda_id),
		habitadas: habitadas.map((fila) => fila.vivienda_id)
	};
}

export function viviendasRelacionadas(vinculos: Vinculos) {
	return [...new Set([...vinculos.titulares, ...vinculos.habitadas])];
}

async function personasDeLaVivienda(viviendaId: string) {
	const sb = getDb();
	const duenos = pedir(await sb.from('titularidades').select('usuario_id').eq('vivienda_id', viviendaId)) as Array<{
		usuario_id: string;
	}>;
	const habitantes = pedir(await sb.from('ocupaciones').select('usuario_id').eq('vivienda_id', viviendaId)) as Array<{
		usuario_id: string;
	}>;
	return new Set([...duenos, ...habitantes].map((fila) => fila.usuario_id));
}

export async function listarDirecciones(fraId: string) {
	const sb = getDb();
	const filas = pedir(
		await sb.from('viviendas').select('id, calle, numero').eq('fraccionamiento_id', fraId).order('calle').order('numero')
	) as Array<{ id: string; calle: string; numero: string }>;
	return filas.map((vivienda) => ({ id: vivienda.id, direccion: direccion(vivienda.calle, vivienda.numero) }));
}

type FiltroIncidencias = {
	estado?: string;
	categoria?: string;
	restringir: boolean;
	viviendaIds: string[];
	usuarioId: string;
};

type IncidenciaLista = {
	id: string;
	categoria: string;
	gravedad: string;
	estado: string;
	ocurrio_en: string;
	reportada_por: string;
	viviendas: { id: string; calle: string; numero: string };
	usuarios: { nombre: string };
};

export async function listarIncidencias(fraId: string, filtro: FiltroIncidencias) {
	const sb = getDb();
	let consulta = sb
		.from('incidencias')
		.select('id, categoria, gravedad, estado, ocurrio_en, reportada_por, viviendas!inner(id, calle, numero), usuarios!inner(nombre)')
		.eq('fraccionamiento_id', fraId);
	if (filtro.categoria) consulta = consulta.eq('categoria', filtro.categoria);
	if (filtro.estado === 'por_revisar') consulta = consulta.in('estado', ['reportada', 'en_revision']);
	else if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);
	if (filtro.restringir) {
		const partes = [`reportada_por.eq.${filtro.usuarioId}`];
		if (filtro.viviendaIds.length > 0) partes.push(`vivienda_id.in.(${filtro.viviendaIds.join(',')})`);
		consulta = consulta.or(partes.join(','));
	}
	const filas = pedir(await consulta.order('ocurrio_en', { ascending: false })) as IncidenciaLista[];
	return filas.map((fila) => ({
		id: fila.id,
		categoria: fila.categoria,
		gravedad: fila.gravedad,
		estado: fila.estado,
		ocurrioEn: fila.ocurrio_en,
		viviendaId: fila.viviendas.id,
		calle: fila.viviendas.calle,
		numero: fila.viviendas.numero,
		reportadaPor: fila.reportada_por,
		reportante: fila.usuarios.nombre,
		direccion: direccion(fila.viviendas.calle, fila.viviendas.numero)
	}));
}

export async function obtenerIncidencia(fraId: string, id: string) {
	const sb = getDb();
	const incidencia = pedir(
		await sb
			.from('incidencias')
			.select(
				'id, categoria, gravedad, descripcion, estado, ocurrio_en, creada_en, respuesta, notas_internas, reportada_por, viviendas!inner(id, calle, numero), usuarios!inner(nombre)'
			)
			.eq('id', id)
			.eq('fraccionamiento_id', fraId)
			.maybeSingle()
	) as (IncidenciaLista & { descripcion: string; creada_en: string; respuesta: string | null; notas_internas: string | null }) | null;
	if (!incidencia) return null;

	const personas = pedir(
		await sb.from('implicados').select('usuarios!inner(id, nombre)').eq('incidencia_id', id)
	) as Array<{ usuarios: { id: string; nombre: string } }>;
	const ocupantes = pedir(
		await sb
			.from('ocupaciones')
			.select('relacion, usuarios!inner(id, nombre, telefono)')
			.eq('vivienda_id', incidencia.viviendas.id)
			.is('hasta', null)
	) as Array<{ relacion: string; usuarios: { id: string; nombre: string; telefono: string | null } }>;
	const linea = pedir(
		await sb.from('sucesos').select('accion, creado_en, usuarios!inner(nombre)').eq('incidencia_id', id).order('creado_en')
	) as Array<{ accion: string; creado_en: string; usuarios: { nombre: string } }>;

	return {
		id: incidencia.id,
		categoria: incidencia.categoria,
		gravedad: incidencia.gravedad,
		descripcion: incidencia.descripcion,
		estado: incidencia.estado,
		ocurrioEn: incidencia.ocurrio_en,
		creadaEn: incidencia.creada_en,
		respuesta: incidencia.respuesta,
		notasInternas: incidencia.notas_internas,
		viviendaId: incidencia.viviendas.id,
		calle: incidencia.viviendas.calle,
		numero: incidencia.viviendas.numero,
		reportadaPor: incidencia.reportada_por,
		reportante: incidencia.usuarios.nombre,
		direccion: direccion(incidencia.viviendas.calle, incidencia.viviendas.numero),
		implicados: personas.map((fila) => fila.usuarios),
		ocupantes: ocupantes
			.map((fila) => ({ ...fila.usuarios, relacion: fila.relacion }))
			.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
		sucesos: linea.map((fila) => ({ accion: fila.accion, creadoEn: fila.creado_en, nombre: fila.usuarios.nombre }))
	};
}

export async function crearIncidencia(input: {
	fraId: string;
	viviendaId: string;
	usuarioId: string;
	categoria: string;
	gravedad: string;
	descripcion: string;
	ocurrioEn: Date;
}) {
	const sb = getDb();
	const casa = pedir(
		await sb.from('viviendas').select('id').eq('id', input.viviendaId).eq('fraccionamiento_id', input.fraId).maybeSingle()
	) as { id: string } | null;
	if (!casa) return { ok: false as const, error: 'Esa vivienda no está en este fraccionamiento.' };

	const id = randomUUID();
	pedir(
		await sb.from('incidencias').insert({
			id,
			fraccionamiento_id: input.fraId,
			vivienda_id: input.viviendaId,
			reportada_por: input.usuarioId,
			categoria: input.categoria,
			gravedad: input.gravedad,
			descripcion: input.descripcion.trim(),
			ocurrio_en: input.ocurrioEn.toISOString(),
			estado: 'reportada',
			respuesta: null,
			notas_internas: null
		})
	);
	pedir(
		await sb.from('sucesos').insert({
			id: randomUUID(),
			incidencia_id: id,
			usuario_id: input.usuarioId,
			accion: 'Registró la incidencia'
		})
	);
	return { ok: true as const, id };
}

export async function resolverIncidencia(input: {
	fraId: string;
	incidenciaId: string;
	actorId: string;
	accion: 'en_revision' | 'confirmada' | 'desestimada';
	respuesta: string;
	notasInternas: string;
	implicadosIds: string[];
}) {
	const sb = getDb();
	const actual = pedir(
		await sb.from('incidencias').select('id, estado, vivienda_id, notas_internas').eq('id', input.incidenciaId).eq('fraccionamiento_id', input.fraId).maybeSingle()
	) as { estado: string; vivienda_id: string; notas_internas: string | null } | null;
	if (!actual) return { ok: false as const, error: 'No encontramos esa incidencia.' };
	if (actual.estado === 'confirmada' || actual.estado === 'desestimada') {
		return { ok: false as const, error: 'Esta incidencia ya está cerrada.' };
	}

	let implicadosValidos: string[] = [];
	if (input.accion === 'confirmada') {
		const permitidos = await personasDeLaVivienda(actual.vivienda_id);
		implicadosValidos = input.implicadosIds.filter((id) => permitidos.has(id));
	}

	pedir(
		await sb
			.from('incidencias')
			.update({
				estado: input.accion,
				respuesta: input.respuesta.trim() || null,
				notas_internas: input.notasInternas.trim() || actual.notas_internas
			})
			.eq('id', input.incidenciaId)
	);

	if (input.accion === 'confirmada') {
		pedir(await sb.from('implicados').delete().eq('incidencia_id', input.incidenciaId));
		if (implicadosValidos.length > 0) {
			pedir(
				await sb.from('implicados').insert(
					implicadosValidos.map((usuarioId) => ({ incidencia_id: input.incidenciaId, usuario_id: usuarioId }))
				)
			);
		}
	}

	const texto =
		input.accion === 'confirmada' ? 'La confirmó' : input.accion === 'desestimada' ? 'La desestimó' : 'La pasó a revisión';
	pedir(
		await sb.from('sucesos').insert({
			id: randomUUID(),
			incidencia_id: input.incidenciaId,
			usuario_id: input.actorId,
			accion: texto
		})
	);
	return { ok: true as const };
}

export async function listarReincidentes(fraId: string) {
	const sb = getDb();
	const hechos = await incidenciasDelFraccionamiento(fraId);
	const conteos = conteoPersonas(hechos);
	const relevantes = conteos.filter((fila) => fila.en365 >= 2);
	const ids = relevantes.map((fila) => fila.id);
	const gente = ids.length
		? (pedir(await sb.from('usuarios').select('id, nombre').in('id', ids)) as Array<{ id: string; nombre: string }>)
		: [];
	const ocupantes = pedir(
		await sb
			.from('ocupaciones')
			.select('usuario_id, relacion, vivienda_id, viviendas!inner(calle, numero, fraccionamiento_id)')
			.is('hasta', null)
			.eq('viviendas.fraccionamiento_id', fraId)
	) as Array<{ usuario_id: string; relacion: string; vivienda_id: string; viviendas: { calle: string; numero: string } }>;

	const personas = relevantes
		.map((fila) => {
			const persona = gente.find((item) => item.id === fila.id);
			const casa = ocupantes.find((item) => item.usuario_id === fila.id);
			return {
				id: fila.id,
				nombre: persona?.nombre ?? 'Persona',
				en90: fila.en90,
				en365: fila.en365,
				nivel: clasificarReincidencia(fila.en90, fila.en365),
				relacion: casa?.relacion ?? null,
				direccion: casa ? direccion(casa.viviendas.calle, casa.viviendas.numero) : null,
				viviendaId: casa?.vivienda_id ?? null
			};
		})
		.sort((a, b) => b.en90 - a.en90 || b.en365 - a.en365 || a.nombre.localeCompare(b.nombre, 'es'));

	const porCasa = conteoViviendas(hechos);
	const casas = pedir(await sb.from('viviendas').select('id, calle, numero').eq('fraccionamiento_id', fraId)) as Array<{
		id: string;
		calle: string;
		numero: string;
	}>;
	const casaIds = casas.map((casa) => casa.id);
	const ocupantesNombres = casaIds.length
		? (pedir(
				await sb
					.from('ocupaciones')
					.select('vivienda_id, usuarios!inner(nombre)')
					.in('vivienda_id', casaIds)
					.is('hasta', null)
			) as Array<{ vivienda_id: string; usuarios: { nombre: string } }>)
		: [];
	const viviendasRepetidas = porCasa
		.filter((fila) => fila.en365 >= 2)
		.map((fila) => {
			const casa = casas.find((item) => item.id === fila.id);
			return {
				id: fila.id,
				direccion: casa ? direccion(casa.calle, casa.numero) : 'Vivienda',
				en365: fila.en365,
				habitantes: ocupantesNombres.filter((item) => item.vivienda_id === fila.id).map((item) => item.usuarios.nombre)
			};
		})
		.sort((a, b) => b.en365 - a.en365 || a.direccion.localeCompare(b.direccion, 'es'));

	return { personas, viviendas: viviendasRepetidas };
}

export async function listarViviendas(fraId: string, ids: string[] | null) {
	if (ids && ids.length === 0) return [];
	const sb = getDb();
	let consulta = sb.from('viviendas').select('id, calle, numero').eq('fraccionamiento_id', fraId);
	if (ids) consulta = consulta.in('id', ids);
	const casas = pedir(await consulta.order('calle').order('numero')) as Array<{ id: string; calle: string; numero: string }>;
	const casaIds = casas.map((casa) => casa.id);
	if (casaIds.length === 0) return [];

	const duenos = pedir(
		await sb.from('titularidades').select('vivienda_id, usuarios!inner(id, nombre)').in('vivienda_id', casaIds).is('hasta', null)
	) as Array<{ vivienda_id: string; usuarios: { id: string; nombre: string } }>;
	const habitantes = pedir(
		await sb
			.from('ocupaciones')
			.select('vivienda_id, relacion, usuarios!inner(id, nombre)')
			.in('vivienda_id', casaIds)
			.is('hasta', null)
	) as Array<{ vivienda_id: string; relacion: string; usuarios: { id: string; nombre: string } }>;
	const conteos = conteoViviendas(await incidenciasDelFraccionamiento(fraId));

	return casas.map((casa) => ({
		id: casa.id,
		direccion: direccion(casa.calle, casa.numero),
		duenos: duenos.filter((item) => item.vivienda_id === casa.id).map((item) => item.usuarios),
		habitantes: habitantes
			.filter((item) => item.vivienda_id === casa.id)
			.map((item) => ({ id: item.usuarios.id, nombre: item.usuarios.nombre, relacion: item.relacion })),
		confirmadas: conteos.find((item) => item.id === casa.id)?.en365 ?? 0,
		abiertas: conteos.find((item) => item.id === casa.id)?.abiertas ?? 0
	}));
}

export async function obtenerVivienda(fraId: string, id: string) {
	const lista = await listarViviendas(fraId, [id]);
	const vivienda = lista[0];
	if (!vivienda) return null;
	const sb = getDb();
	const duenos = pedir(
		await sb.from('titularidades').select('desde, usuarios!inner(id, nombre, telefono)').eq('vivienda_id', id).is('hasta', null)
	) as Array<{ desde: string; usuarios: { id: string; nombre: string; telefono: string | null } }>;
	const habitantes = pedir(
		await sb
			.from('ocupaciones')
			.select('relacion, desde, usuarios!inner(id, nombre, telefono)')
			.eq('vivienda_id', id)
			.is('hasta', null)
	) as Array<{ relacion: string; desde: string; usuarios: { id: string; nombre: string; telefono: string | null } }>;
	const hechos = await listarIncidencias(fraId, { restringir: true, viviendaIds: [id], usuarioId: 'nadie' });
	const cargos = await cuotasConSaldo(fraId, [id]);
	return {
		...vivienda,
		duenosDetalle: duenos.map((fila) => ({ ...fila.usuarios, desde: fila.desde })),
		habitantesDetalle: habitantes.map((fila) => ({ ...fila.usuarios, relacion: fila.relacion, desde: fila.desde })),
		incidencias: hechos,
		cuotas: cargos
	};
}

export async function listarPersonas(fraId: string) {
	const sb = getDb();
	const filasMiembro = pedir(
		await sb
			.from('membresias')
			.select('rol, usuarios!inner(id, nombre, telefono)')
			.eq('fraccionamiento_id', fraId)
	) as Array<{ rol: string; usuarios: { id: string; nombre: string; telefono: string | null } }>;
	const conteos = conteoPersonas(await incidenciasDelFraccionamiento(fraId));
	const casas = await listarViviendas(fraId, null);
	const grupos = new Map<
		string,
		{
			id: string;
			nombre: string;
			telefono: string | null;
			roles: string[];
			en90: number;
			en365: number;
			nivel: ReturnType<typeof clasificarReincidencia>;
			lugares: string[];
		}
	>();
	for (const fila of filasMiembro) {
		let persona = grupos.get(fila.usuarios.id);
		if (!persona) {
			const conteo = conteos.find((item) => item.id === fila.usuarios.id);
			const en90 = conteo?.en90 ?? 0;
			const en365 = conteo?.en365 ?? 0;
			persona = {
				id: fila.usuarios.id,
				nombre: fila.usuarios.nombre,
				telefono: fila.usuarios.telefono,
				roles: [],
				en90,
				en365,
				nivel: clasificarReincidencia(en90, en365),
				lugares: []
			};
			grupos.set(fila.usuarios.id, persona);
		}
		persona.roles.push(fila.rol);
	}
	for (const casa of casas) {
		for (const habitante of casa.habitantes) {
			const persona = grupos.get(habitante.id);
			if (!persona || persona.lugares.some((lugar) => lugar.startsWith(casa.direccion))) continue;
			const texto = habitante.relacion === 'arrendatario' ? 'renta' : habitante.relacion === 'familiar' ? 'familiar' : 'vive aquí';
			persona.lugares.push(`${casa.direccion} · ${texto}`);
		}
		for (const dueno of casa.duenos) {
			const persona = grupos.get(dueno.id);
			if (!persona || persona.lugares.some((lugar) => lugar.startsWith(casa.direccion))) continue;
			persona.lugares.push(`${casa.direccion} · dueño, no vive aquí`);
		}
	}
	return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function obtenerPersona(fraId: string, id: string) {
	const sb = getDb();
	const miembros = pedir(
		await sb
			.from('membresias')
			.select('rol, usuarios!inner(nombre, correo, telefono)')
			.eq('usuario_id', id)
			.eq('fraccionamiento_id', fraId)
	) as Array<{ rol: string; usuarios: { nombre: string; correo: string; telefono: string | null } }>;
	if (miembros.length === 0) return null;
	const hechos = await incidenciasDelFraccionamiento(fraId);
	const conteo = conteoPersonas(hechos).find((item) => item.id === id) ?? { en90: 0, en365: 0 };
	const confirmadas = hechos.filter(
		(fila) => fila.estado === 'confirmada' && (fila.implicados ?? []).some((implicado) => implicado.usuario_id === id)
	);
	const porCategoriaMapa = new Map<string, number>();
	for (const fila of confirmadas) {
		const categoria = fila.categoria ?? 'otra';
		porCategoriaMapa.set(categoria, (porCategoriaMapa.get(categoria) ?? 0) + 1);
	}
	const porCategoria = [...porCategoriaMapa.entries()]
		.map(([categoria, total]) => ({ categoria, total }))
		.sort((a, b) => b.total - a.total);
	const detalle = pedir(
		await sb
			.from('implicados')
			.select('incidencias!inner(id, categoria, gravedad, estado, ocurrio_en, fraccionamiento_id, viviendas!inner(calle, numero))')
			.eq('usuario_id', id)
			.eq('incidencias.fraccionamiento_id', fraId)
			.eq('incidencias.estado', 'confirmada')
	) as Array<{
		incidencias: {
			id: string;
			categoria: string;
			gravedad: string;
			estado: string;
			ocurrio_en: string;
			viviendas: { calle: string; numero: string };
		};
	}>;
	const casas = await listarViviendas(fraId, null);
	const lugares = casas
		.filter((casa) => casa.duenos.some((dueno) => dueno.id === id) || casa.habitantes.some((item) => item.id === id))
		.map((casa) => {
			const habitante = casa.habitantes.find((item) => item.id === id);
			return { id: casa.id, direccion: casa.direccion, vinculo: habitante ? habitante.relacion : 'dueno_ausente' };
		});

	return {
		id,
		nombre: miembros[0].usuarios.nombre,
		correo: miembros[0].usuarios.correo,
		telefono: miembros[0].usuarios.telefono,
		roles: miembros.map((item) => item.rol),
		en90: conteo.en90,
		en365: conteo.en365,
		nivel: clasificarReincidencia(conteo.en90, conteo.en365),
		porCategoria,
		incidencias: detalle
			.map((fila) => ({
				id: fila.incidencias.id,
				categoria: fila.incidencias.categoria,
				gravedad: fila.incidencias.gravedad,
				estado: fila.incidencias.estado,
				ocurrioEn: fila.incidencias.ocurrio_en,
				direccion: direccion(fila.incidencias.viviendas.calle, fila.incidencias.viviendas.numero)
			}))
			.sort((a, b) => new Date(b.ocurrioEn).getTime() - new Date(a.ocurrioEn).getTime()),
		lugares
	};
}

type CuotaFila = {
	id: string;
	vivienda_id: string;
	concepto: string;
	periodo: string;
	monto_centavos: number;
	vencimiento: string;
};

async function cuotasConSaldo(fraId: string, viviendaIds?: string[]) {
	if (viviendaIds && viviendaIds.length === 0) return [];
	const sb = getDb();
	let consulta = sb
		.from('cuotas')
		.select('id, vivienda_id, concepto, periodo, monto_centavos, vencimiento')
		.eq('fraccionamiento_id', fraId);
	if (viviendaIds) consulta = consulta.in('vivienda_id', viviendaIds);
	const lista = pedir(await consulta.order('periodo', { ascending: false })) as CuotaFila[];
	const ids = lista.map((cuota) => cuota.id);
	const abonos = ids.length
		? (pedir(await sb.from('pagos').select('cuota_id, monto_centavos').in('cuota_id', ids)) as Array<{
				cuota_id: string;
				monto_centavos: number;
			}>)
		: [];
	const pagado = new Map<string, number>();
	for (const pago of abonos) pagado.set(pago.cuota_id, (pagado.get(pago.cuota_id) ?? 0) + numero(pago.monto_centavos));
	const hoy = hoyMexico();
	const casas = pedir(await sb.from('viviendas').select('id, calle, numero').eq('fraccionamiento_id', fraId)) as Array<{
		id: string;
		calle: string;
		numero: string;
	}>;
	return lista.map((cuota) => {
		const abono = pagado.get(cuota.id) ?? 0;
		const saldo = numero(cuota.monto_centavos) - abono;
		const casa = casas.find((item) => item.id === cuota.vivienda_id);
		return {
			id: cuota.id,
			viviendaId: cuota.vivienda_id,
			direccion: casa ? direccion(casa.calle, casa.numero) : 'Vivienda',
			concepto: cuota.concepto,
			periodo: cuota.periodo,
			montoCentavos: numero(cuota.monto_centavos),
			vencimiento: cuota.vencimiento,
			abono,
			saldo,
			vencida: saldo > 0 && cuota.vencimiento < hoy
		};
	});
}

export async function listarCuotas(fraId: string, viviendaIds: string[] | null) {
	if (viviendaIds && viviendaIds.length === 0) return [];
	return cuotasConSaldo(fraId, viviendaIds ?? undefined);
}

export async function registrarPago(input: {
	fraId: string;
	cuotaId: string;
	montoCentavos: number;
	pagadoEn: string;
	usuarioId: string;
}) {
	const sb = getDb();
	const cuota = pedir(
		await sb.from('cuotas').select('id, monto_centavos').eq('id', input.cuotaId).eq('fraccionamiento_id', input.fraId).maybeSingle()
	) as { id: string; monto_centavos: number } | null;
	if (!cuota) return { ok: false as const, error: 'No encontramos esa cuota.' };
	const abonos = pedir(await sb.from('pagos').select('monto_centavos').eq('cuota_id', cuota.id)) as Array<{ monto_centavos: number }>;
	const pagado = abonos.reduce((suma, pago) => suma + numero(pago.monto_centavos), 0);
	const saldo = numero(cuota.monto_centavos) - pagado;
	if (input.montoCentavos <= 0 || input.montoCentavos > saldo) {
		return { ok: false as const, error: 'El monto tiene que ser mayor a cero y no pasar el saldo.' };
	}
	pedir(
		await sb.from('pagos').insert({
			id: randomUUID(),
			cuota_id: cuota.id,
			monto_centavos: input.montoCentavos,
			pagado_en: input.pagadoEn,
			registrado_por: input.usuarioId
		})
	);
	return { ok: true as const };
}

export async function generarCuotas(input: {
	fraId: string;
	concepto: string;
	periodo: string;
	montoCentavos: number;
	vencimiento: string;
}) {
	const sb = getDb();
	const casas = pedir(await sb.from('viviendas').select('id').eq('fraccionamiento_id', input.fraId)) as Array<{ id: string }>;
	if (casas.length === 0) return 0;
	const insertadas = pedir(
		await sb
			.from('cuotas')
			.upsert(
				casas.map((casa) => ({
					id: randomUUID(),
					fraccionamiento_id: input.fraId,
					vivienda_id: casa.id,
					concepto: input.concepto.trim(),
					periodo: input.periodo,
					monto_centavos: input.montoCentavos,
					vencimiento: input.vencimiento
				})),
				{ onConflict: 'vivienda_id,periodo,concepto', ignoreDuplicates: true }
			)
			.select('id')
	) as Array<{ id: string }>;
	return insertadas.length;
}

export async function resumenInicio(fraId: string, usuarioId: string, roles: Rol[], vinculos: Vinculos) {
	const sb = getDb();
	const relacionadas = viviendasRelacionadas(vinculos);
	const comite = esComite(roles);
	const recientes = await listarIncidencias(fraId, {
		restringir: !comite,
		viviendaIds: relacionadas,
		usuarioId
	});
	const viviendasUsuario = await listarViviendas(fraId, relacionadas);
	const cargos = vinculos.titulares.length ? await cuotasConSaldo(fraId, vinculos.titulares) : [];

	let porRevisar = 0;
	let cuotasVencidas = 0;
	let personas: Awaited<ReturnType<typeof listarReincidentes>>['personas'] = [];
	if (comite) {
		const abiertas = pedir(
			await sb.from('incidencias').select('id').eq('fraccionamiento_id', fraId).in('estado', ['reportada', 'en_revision'])
		) as Array<{ id: string }>;
		porRevisar = abiertas.length;
		const todas = await cuotasConSaldo(fraId);
		cuotasVencidas = todas.filter((cuota) => cuota.vencida).length;
		personas = (await listarReincidentes(fraId)).personas;
	}

	return {
		porRevisar,
		cuotasVencidas,
		reincidentes: personas.length,
		recientes: recientes.slice(0, 6),
		personas: personas.slice(0, 3),
		viviendas: viviendasUsuario.map((casa) => ({
			...casa,
			saldo: cargos.filter((cuota) => cuota.viviendaId === casa.id).reduce((suma, cuota) => suma + cuota.saldo, 0),
			esTitular: vinculos.titulares.includes(casa.id),
			esHabitante: vinculos.habitadas.includes(casa.id)
		})),
		saldoPropio: cargos.reduce((suma, cuota) => suma + cuota.saldo, 0)
	};
}
