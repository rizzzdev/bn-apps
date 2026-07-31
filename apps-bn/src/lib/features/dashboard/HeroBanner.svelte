<script lang="ts">
	import Typography from '$lib/components/atoms/Typography.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
</script>

<div class="bg-primary text-white border-heavy shadow-hard rounded-lg p-8 md:p-16 mb-12 flex flex-col items-start gap-6">
	<Typography variant="label" className="text-secondary bg-black px-2 py-1">
		Portal Utama
	</Typography>
	<Typography variant="h1" className="text-white max-w-3xl">
		Selamat Datang di Portal Aplikasi Sekolah Terpadu
	</Typography>
	<Typography variant="p" className="text-surface-dim max-w-2xl mb-4">
		Akses seluruh layanan akademik, e-learning, ujian, dan manajemen magang dari satu tempat yang nyaman dan terpusat.
	</Typography>
	<Button variant="secondary" className="text-lg px-8 py-4">
		Jelajahi Aplikasi
	</Button>
</div>
