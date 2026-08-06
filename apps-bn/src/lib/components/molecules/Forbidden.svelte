<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import { resolveRoute } from '$app/paths';
</script>

<div
	class="relative z-10 box-border flex w-full flex-grow items-center justify-center px-4 py-8 sm:px-6 md:py-16 lg:px-8"
>
	<div class="w-full max-w-xl">
		<!-- Error Card -->
		<div
			class="neo-border neo-shadow flex flex-col items-center rounded-2xl bg-surface-container p-6 text-center sm:p-10"
		>
			<!-- Status Badge -->
			<div class="mb-4">
				<span
					class="neo-border inline-block rounded-lg bg-error px-4 py-1.5 font-label-bold text-xs tracking-wider text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-sm"
				>
					HTTP 403 • FORBIDDEN
				</span>
			</div>

			<!-- Big Status Code Number -->
			<h1
				class="mb-4 font-headline-lg text-7xl leading-none font-black tracking-tight text-on-surface sm:text-8xl md:text-9xl"
			>
				403
			</h1>

			<!-- Title -->
			<h2
				class="mb-3 font-headline-lg text-xl font-bold tracking-tight text-on-surface uppercase sm:text-2xl md:text-3xl"
			>
				Akses Ditolak
			</h2>

			<!-- Description -->
			<p
				class="mb-8 max-w-md font-body-md text-sm leading-relaxed text-on-surface-variant sm:text-base"
			>
				Maaf, Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan hubungi Administrator
				jika Anda memerlukan akses tambahan.
			</p>

			<!-- Action Button -->
			<a href={resolveRoute('/')} class="w-full sm:w-auto">
				<Button variant="primary" className="!w-auto px-8 py-3">Kembali ke Beranda</Button>
			</a>
		</div>
	</div>
</div>
