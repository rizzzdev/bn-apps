<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Error {$page.status} - Exam-BN</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-(--bg-primary) px-4">
	<div class="text-center max-w-md">
		<div class="icon-circle-red mx-auto mb-6 h-16 w-16 flex items-center justify-center">
			<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		</div>
		<h1 class="text-4xl font-black text-(--text-primary) mb-2">{$page.status}</h1>
		<p class="text-lg text-(--text-secondary) mb-6">
			{$page.error?.message ?? 'Terjadi kesalahan yang tidak diharapkan.'}
		</p>
		<a href="/" class="btn-primary px-4 py-2 text-sm"> Kembali ke Beranda </a>
	</div>
</div>
