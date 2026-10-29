// @ts-nocheck
import { hashContrasena, PASSWORD_DEMO } from './auth';
import type { AppDb } from './client';
import {
	cuotas,
	fraccionamientos,
	implicados,
	incidencias,
	membresias,
	ocupaciones,
	pagos,
	sucesos,
	titularidades,
	usuarios,
	viviendas
} from './schema';

type UsuarioSeed = {
	id: string;
	nombre: string;
	correo: string;
	telefono: string;
};

type ViviendaSeed = {
	id: string;
	fra: string;
	calle: string;
	numero: string;
};

export async function sembrar(db: AppDb) {
	const hash = await hashContrasena(PASSWORD_DEMO);

	const gente: UsuarioSeed[] = [
		{ id: 'usr-elena', nombre: 'Elena Vargas', correo: 'elena.vargas@vienna.local', telefono: '442 100 0101' },
		{ id: 'usr-luis', nombre: 'Luis Ortega', correo: 'luis.ortega@vienna.local', telefono: '442 100 0102' },
		{ id: 'usr-mariana', nombre: 'Mariana Solís', correo: 'mariana.solis@vienna.local', telefono: '55 1000 2201' },
		{ id: 'usr-diego', nombre: 'Diego Herrera', correo: 'diego.herrera@vienna.local', telefono: '442 100 1201' },
		{ id: 'usr-laura', nombre: 'Laura Méndez', correo: 'laura.mendez@vienna.local', telefono: '442 100 1401' },
		{ id: 'usr-andres', nombre: 'Andrés Molina', correo: 'andres.molina@vienna.local', telefono: '442 100 0301' },
		{ id: 'usr-carmen', nombre: 'Carmen Ibarra', correo: 'carmen.ibarra@vienna.local', telefono: '55 1000 0501' },
		{ id: 'usr-sofia', nombre: 'Sofía Ruiz', correo: 'sofia.ruiz@vienna.local', telefono: '442 100 0502' },
		{ id: 'usr-hector', nombre: 'Héctor Navarro', correo: 'hector.navarro@vienna.local', telefono: '442 100 1001' },
		{ id: 'usr-paula', nombre: 'Paula Ríos', correo: 'paula.rios@vienna.local', telefono: '33 1000 2101' },
		{ id: 'usr-natalia', nombre: 'Natalia Campos', correo: 'natalia.campos@vienna.local', telefono: '33 1000 2401' },
		{ id: 'usr-ivan', nombre: 'Iván Paredes', correo: 'ivan.paredes@vienna.local', telefono: '33 1000 2402' },
		{ id: 'usr-rodrigo', nombre: 'Rodrigo Salas', correo: 'rodrigo.salas@vienna.local', telefono: '33 1000 2601' }
	];

	await db.insert(usuarios).values(
		gente.map((persona) => ({
			id: persona.id,
			nombre: persona.nombre,
			correo: persona.correo,
			telefono: persona.telefono,
			hashContrasena: hash
		}))
	);

	await db.insert(fraccionamientos).values([
		{ id: 'fra-encinos', nombre: 'Los Encinos', ciudad: 'El Marqués', estado: 'Querétaro' },
		{ id: 'fra-bugambilias', nombre: 'Bugambilias', ciudad: 'Zapopan', estado: 'Jalisco' }
	]);

	const roles: Array<{ id: string; usuarioId: string; fraccionamientoId: string; rol: string }> = [
		{ id: 'mem-elena-enc', usuarioId: 'usr-elena', fraccionamientoId: 'fra-encinos', rol: 'administracion' },
		{ id: 'mem-elena-bug', usuarioId: 'usr-elena', fraccionamientoId: 'fra-bugambilias', rol: 'administracion' },
		{ id: 'mem-luis-com', usuarioId: 'usr-luis', fraccionamientoId: 'fra-encinos', rol: 'comite' },
		{ id: 'mem-luis-due', usuarioId: 'usr-luis', fraccionamientoId: 'fra-encinos', rol: 'dueno' },
		{ id: 'mem-luis-hab', usuarioId: 'usr-luis', fraccionamientoId: 'fra-encinos', rol: 'habitante' },
		{ id: 'mem-mariana', usuarioId: 'usr-mariana', fraccionamientoId: 'fra-encinos', rol: 'dueno' },
		{ id: 'mem-diego', usuarioId: 'usr-diego', fraccionamientoId: 'fra-encinos', rol: 'habitante' },
		{ id: 'mem-laura-due', usuarioId: 'usr-laura', fraccionamientoId: 'fra-encinos', rol: 'dueno' },
		{ id: 'mem-laura-hab', usuarioId: 'usr-laura', fraccionamientoId: 'fra-encinos', rol: 'habitante' },
		{ id: 'mem-andres-due', usuarioId: 'usr-andres', fraccionamientoId: 'fra-encinos', rol: 'dueno' },
		{ id: 'mem-andres-hab', usuarioId: 'usr-andres', fraccionamientoId: 'fra-encinos', rol: 'habitante' },
		{ id: 'mem-carmen', usuarioId: 'usr-carmen', fraccionamientoId: 'fra-encinos', rol: 'dueno' },
		{ id: 'mem-sofia', usuarioId: 'usr-sofia', fraccionamientoId: 'fra-encinos', rol: 'habitante' },
		{ id: 'mem-hector-due', usuarioId: 'usr-hector', fraccionamientoId: 'fra-encinos', rol: 'dueno' },
		{ id: 'mem-hector-hab', usuarioId: 'usr-hector', fraccionamientoId: 'fra-encinos', rol: 'habitante' },
		{ id: 'mem-paula-due', usuarioId: 'usr-paula', fraccionamientoId: 'fra-bugambilias', rol: 'dueno' },
		{ id: 'mem-paula-hab', usuarioId: 'usr-paula', fraccionamientoId: 'fra-bugambilias', rol: 'habitante' },
		{ id: 'mem-natalia', usuarioId: 'usr-natalia', fraccionamientoId: 'fra-bugambilias', rol: 'dueno' },
		{ id: 'mem-ivan', usuarioId: 'usr-ivan', fraccionamientoId: 'fra-bugambilias', rol: 'habitante' },
		{ id: 'mem-rodrigo-due', usuarioId: 'usr-rodrigo', fraccionamientoId: 'fra-bugambilias', rol: 'dueno' },
		{ id: 'mem-rodrigo-hab', usuarioId: 'usr-rodrigo', fraccionamientoId: 'fra-bugambilias', rol: 'habitante' }
	];
	await db.insert(membresias).values(roles);

	const casas: ViviendaSeed[] = [
		{ id: 'viv-enc-12', fra: 'fra-encinos', calle: 'Encino', numero: '12' },
		{ id: 'viv-enc-14', fra: 'fra-encinos', calle: 'Encino', numero: '14' },
		{ id: 'viv-rob-3', fra: 'fra-encinos', calle: 'Roble', numero: '3' },
		{ id: 'viv-rob-5', fra: 'fra-encinos', calle: 'Roble', numero: '5' },
		{ id: 'viv-jac-8', fra: 'fra-encinos', calle: 'Jacaranda', numero: '8' },
		{ id: 'viv-jac-10', fra: 'fra-encinos', calle: 'Jacaranda', numero: '10' },
		{ id: 'viv-bug-21', fra: 'fra-bugambilias', calle: 'Bugambilia', numero: '21' },
		{ id: 'viv-bug-24', fra: 'fra-bugambilias', calle: 'Bugambilia', numero: '24' },
		{ id: 'viv-bug-26', fra: 'fra-bugambilias', calle: 'Bugambilia', numero: '26' }
	];
	await db.insert(viviendas).values(
		casas.map((casa) => ({
			id: casa.id,
			fraccionamientoId: casa.fra,
			calle: casa.calle,
			numero: casa.numero
		}))
	);

	await db.insert(titularidades).values([
		{ id: 'tit-enc-12', viviendaId: 'viv-enc-12', usuarioId: 'usr-mariana', desde: '2019-06-01', hasta: null },
		{ id: 'tit-enc-14', viviendaId: 'viv-enc-14', usuarioId: 'usr-laura', desde: '2018-02-01', hasta: null },
		{ id: 'tit-rob-3', viviendaId: 'viv-rob-3', usuarioId: 'usr-andres', desde: '2021-04-12', hasta: null },
		{ id: 'tit-rob-5', viviendaId: 'viv-rob-5', usuarioId: 'usr-carmen', desde: '2016-11-01', hasta: null },
		{ id: 'tit-jac-8', viviendaId: 'viv-jac-8', usuarioId: 'usr-luis', desde: '2020-08-01', hasta: null },
		{ id: 'tit-jac-10', viviendaId: 'viv-jac-10', usuarioId: 'usr-hector', desde: '2022-01-15', hasta: null },
		{ id: 'tit-bug-21', viviendaId: 'viv-bug-21', usuarioId: 'usr-paula', desde: '2017-05-01', hasta: null },
		{ id: 'tit-bug-24', viviendaId: 'viv-bug-24', usuarioId: 'usr-natalia', desde: '2015-09-01', hasta: null },
		{ id: 'tit-bug-26', viviendaId: 'viv-bug-26', usuarioId: 'usr-rodrigo', desde: '2023-03-01', hasta: null }
	]);

	await db.insert(ocupaciones).values([
		{ id: 'ocu-diego', viviendaId: 'viv-enc-12', usuarioId: 'usr-diego', relacion: 'arrendatario', desde: '2025-11-01', hasta: null },
		{ id: 'ocu-laura', viviendaId: 'viv-enc-14', usuarioId: 'usr-laura', relacion: 'dueno', desde: '2018-02-01', hasta: null },
		{ id: 'ocu-andres', viviendaId: 'viv-rob-3', usuarioId: 'usr-andres', relacion: 'dueno', desde: '2021-04-12', hasta: null },
		{ id: 'ocu-sofia', viviendaId: 'viv-rob-5', usuarioId: 'usr-sofia', relacion: 'arrendatario', desde: '2025-01-15', hasta: null },
		{ id: 'ocu-luis', viviendaId: 'viv-jac-8', usuarioId: 'usr-luis', relacion: 'dueno', desde: '2020-08-01', hasta: null },
		{ id: 'ocu-hector', viviendaId: 'viv-jac-10', usuarioId: 'usr-hector', relacion: 'dueno', desde: '2022-01-15', hasta: null },
		{ id: 'ocu-paula', viviendaId: 'viv-bug-21', usuarioId: 'usr-paula', relacion: 'dueno', desde: '2017-05-01', hasta: null },
		{ id: 'ocu-ivan', viviendaId: 'viv-bug-24', usuarioId: 'usr-ivan', relacion: 'arrendatario', desde: '2026-02-01', hasta: null },
		{ id: 'ocu-rodrigo', viviendaId: 'viv-bug-26', usuarioId: 'usr-rodrigo', relacion: 'dueno', desde: '2023-03-01', hasta: null }
	]);

	const cuando = (valor: string) => new Date(valor);

	await db.insert(incidencias).values([
		{
			id: 'inc-diego-1',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-enc-12',
			reportadaPor: 'usr-laura',
			categoria: 'musica_alta',
			gravedad: 'grave',
			descripcion:
				'Bocina a alto volumen desde la recámara que da a Encino. Empezó pasada la 1:30 y siguió más de una hora. Se escuchaba la letra desde la banqueta.',
			ocurrioEn: cuando('2026-10-18T01:40:00-06:00'),
			estado: 'confirmada',
			respuesta: 'El comité confirmó el reporte con dos vecinos de la misma calle.',
			notasInternas: 'Tercera conducta de madrugada en la vivienda. Hablar con la dueña.',
			creadaEn: cuando('2026-10-18T09:10:00-06:00')
		},
		{
			id: 'inc-diego-2',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-enc-12',
			reportadaPor: 'usr-hector',
			categoria: 'musica_alta',
			gravedad: 'moderada',
			descripcion: 'Música electrónica después de las 2:00. Bajó el volumen cuando un vecino tocó, y volvió a subir a los veinte minutos.',
			ocurrioEn: cuando('2026-09-30T02:10:00-06:00'),
			estado: 'confirmada',
			respuesta: 'Quedó confirmada. Se pidió a la vivienda respetar el silencio a partir de las 22:00.',
			notasInternas: null,
			creadaEn: cuando('2026-09-30T08:40:00-06:00')
		},
		{
			id: 'inc-diego-3',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-enc-12',
			reportadaPor: 'usr-andres',
			categoria: 'fiesta',
			gravedad: 'moderada',
			descripcion: 'Reunión con varias personas en el estacionamiento y música hasta pasada la medianoche. Había vasos en la banqueta al día siguiente.',
			ocurrioEn: cuando('2026-08-12T00:55:00-06:00'),
			estado: 'confirmada',
			respuesta: 'Confirmada. La dueña dijo que hablaría con quien renta.',
			notasInternas: 'Mariana vive en la Ciudad de México. El arrendatario es Diego Herrera.',
			creadaEn: cuando('2026-08-12T11:05:00-06:00')
		},
		{
			id: 'inc-diego-4',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-enc-12',
			reportadaPor: 'usr-luis',
			categoria: 'musica_alta',
			gravedad: 'grave',
			descripcion: 'Otra vez música alta, ahora cerca de la 1:15. Se distingue desde Jacaranda. Sigue al momento de registrar esto.',
			ocurrioEn: cuando('2026-10-21T01:15:00-06:00'),
			estado: 'reportada',
			respuesta: null,
			notasInternas: null,
			creadaEn: cuando('2026-10-21T01:28:00-06:00')
		},
		{
			id: 'inc-sofia-1',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-rob-5',
			reportadaPor: 'usr-laura',
			categoria: 'basura',
			gravedad: 'moderada',
			descripcion: 'Bolsas de basura doméstica en la banqueta desde el viernes. El lunes seguían ahí y ya había fauna.',
			ocurrioEn: cuando('2026-06-01T18:30:00-06:00'),
			estado: 'confirmada',
			respuesta: 'Confirmada. Se notificó a la dueña, que no vive en el fraccionamiento.',
			notasInternas: null,
			creadaEn: cuando('2026-06-02T09:00:00-06:00')
		},
		{
			id: 'inc-sofia-2',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-rob-5',
			reportadaPor: 'usr-andres',
			categoria: 'basura',
			gravedad: 'leve',
			descripcion: 'Restos de jardinería y una caja de cartón mojada frente al portón, ocupando parte de la banqueta.',
			ocurrioEn: cuando('2026-09-14T17:10:00-06:00'),
			estado: 'confirmada',
			respuesta: 'Confirmada. La habitante retiró los restos al día siguiente.',
			notasInternas: null,
			creadaEn: cuando('2026-09-14T19:02:00-06:00')
		},
		{
			id: 'inc-sofia-3',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-rob-5',
			reportadaPor: 'usr-hector',
			categoria: 'basura',
			gravedad: 'leve',
			descripcion: 'Había dos bolsas en la esquina de Roble. Más tarde se vio que el camión todavía no pasaba por esa calle.',
			ocurrioEn: cuando('2026-10-05T08:20:00-06:00'),
			estado: 'desestimada',
			respuesta: 'Se desestimó: la recolección de esa semana pasó después del mediodía.',
			notasInternas: 'No sumar a Sofía.',
			creadaEn: cuando('2026-10-05T08:35:00-06:00')
		},
		{
			id: 'inc-andres-1',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-rob-3',
			reportadaPor: 'usr-luis',
			categoria: 'estacionamiento',
			gravedad: 'leve',
			descripcion: 'La camioneta gris quedó atravesada en el retorno de Roble durante la noche y estorbó la salida de otra vivienda.',
			ocurrioEn: cuando('2026-10-02T23:40:00-06:00'),
			estado: 'confirmada',
			respuesta: 'Confirmada como hecho aislado. Andrés la movió en la mañana.',
			notasInternas: null,
			creadaEn: cuando('2026-10-03T07:50:00-06:00')
		},
		{
			id: 'inc-laura-1',
			fraccionamientoId: 'fra-encinos',
			viviendaId: 'viv-enc-14',
			reportadaPor: 'usr-hector',
			categoria: 'otro',
			gravedad: 'leve',
			descripcion: 'Ruido de niños jugando en el patio por la tarde. No había música ni gritos hacia la calle.',
			ocurrioEn: cuando('2026-10-09T16:30:00-06:00'),
			estado: 'desestimada',
			respuesta: 'Se desestimó. El ruido fue de día y no es una conducta a registrar.',
			notasInternas: null,
			creadaEn: cuando('2026-10-09T18:00:00-06:00')
		},
		{
			id: 'inc-paula-1',
			fraccionamientoId: 'fra-bugambilias',
			viviendaId: 'viv-bug-21',
			reportadaPor: 'usr-rodrigo',
			categoria: 'fiesta',
			gravedad: 'grave',
			descripcion: 'Fiesta en la azotea con bocina hacia Bugambilia. Siguió después de la 1:00 y había gente en la cochera.',
			ocurrioEn: cuando('2026-08-16T00:30:00-06:00'),
			estado: 'confirmada',
			respuesta: 'El comité de administración confirmó el reporte.',
			notasInternas: null,
			creadaEn: cuando('2026-08-16T10:15:00-06:00')
		},
		{
			id: 'inc-paula-2',
			fraccionamientoId: 'fra-bugambilias',
			viviendaId: 'viv-bug-21',
			reportadaPor: 'usr-ivan',
			categoria: 'fiesta',
			gravedad: 'moderada',
			descripcion: 'Otra reunión el sábado. La música se escuchaba dentro de Bugambilia 24 con las ventanas cerradas.',
			ocurrioEn: cuando('2026-10-03T01:05:00-06:00'),
			estado: 'confirmada',
			respuesta: 'Confirmada. Es la segunda fiesta registrada este año.',
			notasInternas: null,
			creadaEn: cuando('2026-10-03T09:40:00-06:00')
		},
		{
			id: 'inc-paula-3',
			fraccionamientoId: 'fra-bugambilias',
			viviendaId: 'viv-bug-21',
			reportadaPor: 'usr-rodrigo',
			categoria: 'musica_alta',
			gravedad: 'moderada',
			descripcion: 'Música desde las 23:40. No parece una fiesta grande, pero el volumen ya no deja dormir.',
			ocurrioEn: cuando('2026-10-20T23:40:00-06:00'),
			estado: 'en_revision',
			respuesta: null,
			notasInternas: 'Falta preguntar a Natalia si también lo escuchó. Iván vive enfrente.',
			creadaEn: cuando('2026-10-21T08:05:00-06:00')
		}
	]);

	await db.insert(implicados).values([
		{ incidenciaId: 'inc-diego-1', usuarioId: 'usr-diego' },
		{ incidenciaId: 'inc-diego-2', usuarioId: 'usr-diego' },
		{ incidenciaId: 'inc-diego-3', usuarioId: 'usr-diego' },
		{ incidenciaId: 'inc-sofia-1', usuarioId: 'usr-sofia' },
		{ incidenciaId: 'inc-sofia-2', usuarioId: 'usr-sofia' },
		{ incidenciaId: 'inc-andres-1', usuarioId: 'usr-andres' },
		{ incidenciaId: 'inc-paula-1', usuarioId: 'usr-paula' },
		{ incidenciaId: 'inc-paula-2', usuarioId: 'usr-paula' }
	]);

	await db.insert(sucesos).values([
		{ id: 'suc-1', incidenciaId: 'inc-diego-1', usuarioId: 'usr-laura', accion: 'Registró la incidencia', creadoEn: cuando('2026-10-18T09:10:00-06:00') },
		{ id: 'suc-2', incidenciaId: 'inc-diego-1', usuarioId: 'usr-elena', accion: 'La confirmó', creadoEn: cuando('2026-10-18T12:00:00-06:00') },
		{ id: 'suc-3', incidenciaId: 'inc-diego-2', usuarioId: 'usr-hector', accion: 'Registró la incidencia', creadoEn: cuando('2026-09-30T08:40:00-06:00') },
		{ id: 'suc-4', incidenciaId: 'inc-diego-2', usuarioId: 'usr-luis', accion: 'La confirmó', creadoEn: cuando('2026-09-30T18:10:00-06:00') },
		{ id: 'suc-5', incidenciaId: 'inc-diego-3', usuarioId: 'usr-andres', accion: 'Registró la incidencia', creadoEn: cuando('2026-08-12T11:05:00-06:00') },
		{ id: 'suc-6', incidenciaId: 'inc-diego-3', usuarioId: 'usr-elena', accion: 'La confirmó', creadoEn: cuando('2026-08-13T09:20:00-06:00') },
		{ id: 'suc-7', incidenciaId: 'inc-diego-4', usuarioId: 'usr-luis', accion: 'Registró la incidencia', creadoEn: cuando('2026-10-21T01:28:00-06:00') },
		{ id: 'suc-8', incidenciaId: 'inc-sofia-1', usuarioId: 'usr-laura', accion: 'Registró la incidencia', creadoEn: cuando('2026-06-02T09:00:00-06:00') },
		{ id: 'suc-9', incidenciaId: 'inc-sofia-1', usuarioId: 'usr-elena', accion: 'La confirmó', creadoEn: cuando('2026-06-03T10:00:00-06:00') },
		{ id: 'suc-10', incidenciaId: 'inc-sofia-2', usuarioId: 'usr-andres', accion: 'Registró la incidencia', creadoEn: cuando('2026-09-14T19:02:00-06:00') },
		{ id: 'suc-11', incidenciaId: 'inc-sofia-2', usuarioId: 'usr-luis', accion: 'La confirmó', creadoEn: cuando('2026-09-15T09:12:00-06:00') },
		{ id: 'suc-12', incidenciaId: 'inc-sofia-3', usuarioId: 'usr-hector', accion: 'Registró la incidencia', creadoEn: cuando('2026-10-05T08:35:00-06:00') },
		{ id: 'suc-13', incidenciaId: 'inc-sofia-3', usuarioId: 'usr-elena', accion: 'La desestimó', creadoEn: cuando('2026-10-05T13:10:00-06:00') },
		{ id: 'suc-14', incidenciaId: 'inc-andres-1', usuarioId: 'usr-luis', accion: 'Registró la incidencia', creadoEn: cuando('2026-10-03T07:50:00-06:00') },
		{ id: 'suc-15', incidenciaId: 'inc-andres-1', usuarioId: 'usr-elena', accion: 'La confirmó', creadoEn: cuando('2026-10-03T11:30:00-06:00') },
		{ id: 'suc-16', incidenciaId: 'inc-laura-1', usuarioId: 'usr-hector', accion: 'Registró la incidencia', creadoEn: cuando('2026-10-09T18:00:00-06:00') },
		{ id: 'suc-17', incidenciaId: 'inc-laura-1', usuarioId: 'usr-luis', accion: 'La desestimó', creadoEn: cuando('2026-10-10T09:00:00-06:00') },
		{ id: 'suc-18', incidenciaId: 'inc-paula-1', usuarioId: 'usr-rodrigo', accion: 'Registró la incidencia', creadoEn: cuando('2026-08-16T10:15:00-06:00') },
		{ id: 'suc-19', incidenciaId: 'inc-paula-1', usuarioId: 'usr-elena', accion: 'La confirmó', creadoEn: cuando('2026-08-17T09:00:00-06:00') },
		{ id: 'suc-20', incidenciaId: 'inc-paula-2', usuarioId: 'usr-ivan', accion: 'Registró la incidencia', creadoEn: cuando('2026-10-03T09:40:00-06:00') },
		{ id: 'suc-21', incidenciaId: 'inc-paula-2', usuarioId: 'usr-elena', accion: 'La confirmó', creadoEn: cuando('2026-10-04T12:15:00-06:00') },
		{ id: 'suc-22', incidenciaId: 'inc-paula-3', usuarioId: 'usr-rodrigo', accion: 'Registró la incidencia', creadoEn: cuando('2026-10-21T08:05:00-06:00') },
		{ id: 'suc-23', incidenciaId: 'inc-paula-3', usuarioId: 'usr-elena', accion: 'La pasó a revisión', creadoEn: cuando('2026-10-21T18:40:00-06:00') }
	]);

	const periodos = [
		{ periodo: '2026-09', vencimiento: '2026-09-10', pagadoEn: '2026-09-08' },
		{ periodo: '2026-10', vencimiento: '2026-10-10', pagadoEn: '2026-10-07' }
	];
	const montos: Record<string, number> = {
		'fra-encinos': 185000,
		'fra-bugambilias': 240000
	};
	const octubrePendiente = new Set(['viv-enc-12', 'viv-rob-5', 'viv-bug-21']);

	const filasCuotas = casas.flatMap((casa) =>
		periodos.map((periodo) => ({
			id: `cuo-${casa.id}-${periodo.periodo}`,
			fraccionamientoId: casa.fra,
			viviendaId: casa.id,
			concepto: 'Cuota de mantenimiento',
			periodo: periodo.periodo,
			montoCentavos: montos[casa.fra],
			vencimiento: periodo.vencimiento
		}))
	);
	await db.insert(cuotas).values(filasCuotas);

	const filasPagos = filasCuotas
		.filter((cuota) => cuota.periodo === '2026-09' || !octubrePendiente.has(cuota.viviendaId))
		.map((cuota) => ({
			id: `pag-${cuota.id}`,
			cuotaId: cuota.id,
			montoCentavos: cuota.montoCentavos,
			pagadoEn: cuota.periodo === '2026-09' ? '2026-09-08' : '2026-10-07',
			registradoPor: 'usr-elena'
		}));
	await db.insert(pagos).values(filasPagos);
}
