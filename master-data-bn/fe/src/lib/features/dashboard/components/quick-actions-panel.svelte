<script lang="ts">
	import { QuickActionItem } from '$lib/components/molecules';

	let actions = [
		{ title: 'Tambah Murid Baru', href: '/student' },
		{ title: 'Daftarkan Guru', href: '/teacher' },
		{ title: 'Buat Kelas Baru', href: '/class' },
		{ title: 'Daftar Program Jurusan', href: '/major' },
		{ title: 'Pengaturan Tahun Ajaran', href: '/academic-year' }
	];
</script>

<section
	class="bg-surface border-on-background flex flex-col border-3 rounded-xl overflow-hidden shadow-neo h-full"
>
	<div class="border-on-background p-md bg-secondary text-on-secondary border-b-3">
		<h3 class="font-headline-md text-headline-md tracking-tight uppercase">
			Tindakan Cepat
		</h3>
	</div>
	<div class="p-md gap-sm flex flex-col flex-1">
		{#each actions as action}
			<QuickActionItem href={action.href}>{action.title}</QuickActionItem>
		{/each}
	</div>
	<div class="p-md border-on-background bg-surface-variant border-t-3 mt-auto">
		<div class="font-label-sm text-label-sm mb-2 uppercase">Status Sistem</div>
		<div class="gap-xs flex items-center">
			<div class="border-on-background h-3 w-3 border-2 bg-[#A3E635]"></div>
			<span class="font-body-bold text-body-bold">Semua Layanan Normal</span>
		</div>
	</div>
</section>
