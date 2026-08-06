<script lang="ts">
	import { page } from '$app/stores';
	import { resolveRoute } from '$app/paths';
	import Navbar from '$lib/components/organisms/Navbar.svelte';
	import Footer from '$lib/components/organisms/Footer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';

	let status = $derived($page.status);
	let is403 = $derived(status === 403);
	let is404 = $derived(status === 404);
</script>

<div
	class="bg-grid-boxes text-body-md relative box-border flex min-h-dvh w-full flex-col overflow-x-hidden bg-background font-body-md text-on-background"
>
	<Navbar currentPath={$page.url ? $page.url.pathname : '/'} />

	<main
		class="relative z-10 box-border flex w-full flex-grow items-center justify-center px-4 py-8 sm:px-6 md:py-16 lg:px-8"
	>
		<div class="w-full max-w-xl">
			<!-- Error Card -->
			<div
				class="neo-border neo-shadow flex flex-col items-center rounded-2xl bg-surface-container p-6 text-center sm:p-10"
			>
				<!-- Status Badge (Above Number to prevent text collision) -->
				<div class="mb-4">
					{#if is403}
						<span
							class="neo-border inline-block rounded-lg bg-error px-4 py-1.5 font-label-bold text-xs tracking-wider text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-sm"
						>
							HTTP 403 • FORBIDDEN
						</span>
					{:else if is404}
						<span
							class="neo-border inline-block rounded-lg bg-secondary-fixed px-4 py-1.5 font-label-bold text-xs tracking-wider text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-sm"
						>
							HTTP 404 • NOT FOUND
						</span>
					{:else}
						<span
							class="neo-border inline-block rounded-lg bg-tertiary-fixed px-4 py-1.5 font-label-bold text-xs tracking-wider text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-sm"
						>
							HTTP {status} • ERROR
						</span>
					{/if}
				</div>

				<!-- Big Status Code Number -->
				<h1
					class="mb-4 font-headline-lg text-7xl leading-none font-black tracking-tight text-on-surface sm:text-8xl md:text-9xl"
				>
					{status}
				</h1>

				<!-- Title -->
				<h2
					class="mb-3 font-headline-lg text-xl font-bold tracking-tight text-on-surface uppercase sm:text-2xl md:text-3xl"
				>
					{#if is403}
						Akses Ditolak
					{:else if is404}
						Halaman Tidak Ditemukan
					{:else}
						Terjadi Kesalahan Sistem
					{/if}
				</h2>

				<!-- Description -->
				<p
					class="mb-8 max-w-md font-body-md text-sm leading-relaxed text-on-surface-variant sm:text-base"
				>
					{#if is403}
						Maaf, Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan hubungi
						Administrator jika Anda memerlukan akses tambahan.
					{:else if is404}
						Halaman yang Anda tuju tidak ada atau telah dipindahkan. Silakan periksa kembali URL
						yang Anda tuju.
					{:else}
						Sistem kami mengalami kendala teknis saat memproses permintaan Anda. Silakan coba lagi
						nanti.
					{/if}
				</p>

				<!-- Action Button -->
				<a href={resolveRoute('/')} class="w-full sm:w-auto">
					<Button variant="primary" className="!w-auto px-8 py-3">Kembali ke Beranda</Button>
				</a>
			</div>
		</div>
	</main>

	<Footer />
</div>
