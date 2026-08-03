<script lang="ts">
	import { page } from '$app/stores';
	import { Button, Icon } from '$lib/components/atoms';
</script>

<svelte:head>
	<title>{$page.status} Error | Master-BN</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[70vh]">
	<section
		class="bg-primary-container border-on-background border-3 shadow-neo flex flex-col p-xl items-center justify-center text-center gap-md rounded-xl max-w-2xl w-full"
	>
		<div
			class="bg-error text-on-error p-sm border-3 border-on-background rounded-lg shadow-neo-sm mb-sm inline-flex items-center justify-center"
		>
			<Icon name={$page.status === 404 ? 'search_off' : 'warning'} class="text-5xl" />
		</div>

		<h1
			class="font-display-lg text-[80px] font-bold tracking-tighter uppercase leading-none text-on-surface"
		>
			{$page.status}
		</h1>

		<h2 class="font-headline-md text-2xl uppercase mb-sm text-on-surface">
			{#if $page.status === 404}
				Halaman Tidak Ditemukan
			{:else}
				Terjadi Kesalahan Sistem
			{/if}
		</h2>

		<p class="font-body-base text-on-surface-variant mb-lg text-lg">
			{#if $page.status === 404}
				Maaf, halaman atau rute yang Anda tuju tidak ada. Mungkin URL-nya salah ketik atau halaman
				telah dihapus.
			{:else}
				{$page.error?.message || 'Sistem sedang mengalami gangguan saat memproses permintaan Anda.'}
			{/if}
		</p>

		<div class="flex gap-md">
			<Button variant="primary" onclick={() => window.history.back()}>
				<Icon name="arrow_back" />
				Kembali
			</Button>
			<Button
				variant="secondary"
				class="bg-surface text-on-surface hover:bg-surface-variant"
				href="/"
			>
				<Icon name="home" />
				Ke Dasbor
			</Button>
		</div>
	</section>
</div>
