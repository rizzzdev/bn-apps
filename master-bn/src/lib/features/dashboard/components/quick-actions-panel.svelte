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
	<div class="border-on-background p-3 px-4 bg-secondary text-on-secondary border-b-3">
		<h3 class="font-headline-md text-base md:text-lg font-black tracking-tight uppercase">
			Tindakan Cepat
		</h3>
	</div>
	<div class="p-3 gap-2 flex flex-wrap items-center flex-1">
		{#each actions as action (action.href)}
			<QuickActionItem href={action.href}>{action.title}</QuickActionItem>
		{/each}
	</div>
	<div class="p-3 px-4 border-on-background bg-surface-variant border-t-3 mt-auto">
		<div class="font-label-sm text-xs mb-1 uppercase font-bold text-on-surface-variant">
			Status Sistem
		</div>
		<div class="gap-2 flex items-center">
			<div
				class="border-on-background h-2.5 w-2.5 border-2 bg-[#A3E635] shadow-neo-xs rounded-full"
			></div>
			<span class="font-body-bold text-xs font-bold">Semua Layanan Normal</span>
		</div>
	</div>
</section>
