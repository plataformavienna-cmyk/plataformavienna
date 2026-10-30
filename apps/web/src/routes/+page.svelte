<script lang="ts">
	import { enhance } from '$app/forms';
	import { ROLES } from '$lib/catalogo';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let modo: 'entrar' | 'crear' = $state('entrar');

	$effect(() => {
		if (form && 'nombre' in form) modo = 'crear';
	});

	const relatos: Record<string, string> = {
		'usr-elena': 'Administra Los Encinos y Bugambilias',
		'usr-luis': 'Comité y vecino en Los Encinos',
		'usr-mariana': 'Dueña de Encino 12, vive fuera',
		'usr-diego': 'Renta Encino 12'
	};

	function detalle(cuenta: NonNullable<typeof data.demo>['destacadas'][number]) {
		return (
			relatos[cuenta.id] ??
			cuenta.fraccionamientos
				.map((grupo) => `${grupo.nombre}: ${grupo.roles.map((rol) => ROLES[rol] ?? rol).join(', ')}`)
				.join(' · ')
		);
	}
</script>

<svelte:head>
	<title>Entrar · Vienna</title>
</svelte:head>

<main class="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-[1.1fr_0.9fr]">
	<section>
		<p class="text-sm font-semibold tracking-wide text-pino">Vienna</p>
		<h1 class="mt-2 text-4xl font-semibold tracking-tight">Conductas del fraccionamiento, con nombre y vivienda.</h1>
		<p class="mt-4 max-w-xl text-lg text-tinta/75">
			El comité registra lo que ocurre —música en la madrugada, basura, estacionamiento— y distingue a quien reincide.
			Las cuotas existen, pero no son el centro.
		</p>
		<ul class="mt-6 space-y-2 text-tinta/80">
			<li>Un reporte no cuenta como falta hasta que el comité lo confirma.</li>
			<li>Quien renta y quien es dueño tienen cuentas distintas.</li>
			<li>Cada fraccionamiento solo ve sus propias viviendas.</li>
		</ul>
	</section>

	<section class="tarjeta">
		<div class="flex gap-2 border-b border-linea pb-3">
			<button
				class="rounded-md px-3 py-1.5 text-sm font-semibold {modo === 'entrar' ? 'bg-pino text-white' : 'text-tinta/70'}"
				type="button"
				onclick={() => (modo = 'entrar')}
			>
				Entrar
			</button>
			<button
				class="rounded-md px-3 py-1.5 text-sm font-semibold {modo === 'crear' ? 'bg-pino text-white' : 'text-tinta/70'}"
				type="button"
				onclick={() => (modo = 'crear')}
			>
				Crear cuenta
			</button>
		</div>

		{#if data.aviso}
			<p class="mt-3 text-sm font-semibold text-rose-800">{data.aviso}</p>
		{/if}

		{#if modo === 'entrar'}
			{#if data.google}
				<form method="POST" action="/auth/google" class="mt-4">
					<button class="btn w-full" type="submit">Continuar con Google</button>
				</form>
				<p class="mt-4 text-center text-sm text-tinta/60">o con correo</p>
			{/if}
			<form method="POST" action="?/entrar" class="mt-4 space-y-3" use:enhance>
				<label class="block">
					<span class="mb-1 block text-sm font-semibold">Correo</span>
					<input
						class="campo"
						name="correo"
						type="email"
						autocomplete="username"
						required
						placeholder="tu@correo.com"
						value={form?.correo ?? ''}
					/>
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-semibold">Contraseña</span>
					<input
						class="campo"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						placeholder="Tu contraseña"
					/>
				</label>
				{#if form?.error}
					<p class="text-sm font-semibold text-rose-800">{form.error}</p>
				{/if}
				<button class="btn w-full" type="submit">Entrar</button>
			</form>
		{:else}
			<form method="POST" action="?/crear" class="mt-4 space-y-3" use:enhance>
				<label class="block">
					<span class="mb-1 block text-sm font-semibold">Nombre</span>
					<input
						class="campo"
						name="nombre"
						type="text"
						autocomplete="name"
						required
						placeholder="Tu nombre completo"
						value={form && 'nombre' in form ? (form.nombre ?? '') : ''}
					/>
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-semibold">Correo</span>
					<input
						class="campo"
						name="correo"
						type="email"
						autocomplete="email"
						required
						placeholder="tu@correo.com"
						value={form?.correo ?? ''}
					/>
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-semibold">Contraseña</span>
					<input
						class="campo"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						minlength="6"
						placeholder="Mínimo 6 caracteres"
					/>
				</label>
				{#if form?.error}
					<p class="text-sm font-semibold text-rose-800">{form.error}</p>
				{/if}
				<button class="btn w-full" type="submit">Crear cuenta</button>
			</form>
		{/if}

		{#if data.demo}
			<div class="mt-6 border-t border-linea pt-5">
				<p class="text-sm font-semibold">Cuentas de demostración</p>
				<p class="mt-1 text-sm text-tinta/70">Contraseña compartida: {data.demo.password}</p>
				<div class="mt-3 space-y-2">
					{#each data.demo.destacadas as cuenta (cuenta.id)}
						<form method="POST" action="?/entrar" use:enhance>
							<input type="hidden" name="correo" value={cuenta.correo} />
							<input type="hidden" name="password" value={data.demo?.password} />
							<button class="btn-sec w-full flex-col items-start py-2 text-left" type="submit">
								<span>{cuenta.nombre}</span>
								<span class="text-xs font-medium text-tinta/60">{detalle(cuenta)}</span>
							</button>
						</form>
					{/each}
				</div>
				{#if data.demo.otras.length > 0}
					<details class="mt-3">
						<summary class="cursor-pointer text-sm font-semibold text-pino">Otras cuentas</summary>
						<div class="mt-2 space-y-2">
							{#each data.demo.otras as cuenta (cuenta.id)}
								<form method="POST" action="?/entrar" use:enhance>
									<input type="hidden" name="correo" value={cuenta.correo} />
									<input type="hidden" name="password" value={data.demo?.password} />
									<button class="btn-sec w-full flex-col items-start py-2 text-left" type="submit">
										<span>{cuenta.nombre}</span>
										<span class="text-xs font-medium text-tinta/60">{detalle(cuenta)}</span>
									</button>
								</form>
							{/each}
						</div>
					</details>
				{/if}
			</div>
		{/if}
	</section>
</main>
