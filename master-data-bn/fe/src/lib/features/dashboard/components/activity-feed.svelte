<script lang="ts">
	import { ActivityItem } from '$lib/components/molecules';

	let activities = [
		{
			icon: 'event_note',
			iconBgColor: 'bg-[#3B82F6]',
			iconTextColor: 'text-white',
			title: 'Tahun Ajaran Baru Dibuat',
			time: 'BARU SAJA',
			description: 'Tahun ajaran 2024/2025 semester Ganjil telah diaktifkan oleh sistem.'
		},
		{
			icon: 'person_add',
			iconBgColor: 'bg-secondary',
			iconTextColor: 'text-on-secondary',
			title: 'Data Murid Diperbarui',
			time: '15 MENIT LALU',
			description: 'Data Budi Darmawan diperbarui menjadi LULUS oleh Administrator.'
		},
		{
			icon: 'school',
			iconBgColor: 'bg-[#A3E635]',
			iconTextColor: 'text-on-surface',
			title: 'Jurusan Baru Ditambahkan',
			time: '2 JAM LALU',
			description: 'Jurusan Rekayasa Perangkat Lunak (RPL) berhasil didaftarkan.'
		},
		{
			icon: 'record_voice_over',
			iconBgColor: 'bg-[#FCD34D]',
			iconTextColor: 'text-on-surface',
			title: 'Status Guru Berubah',
			time: 'KEMARIN',
			description: 'Status Bapak Ir. Agus Pratama diubah menjadi CUTI.'
		}
	];
</script>

<section
	class="bg-primary-container border-on-background border-3 rounded-xl overflow-hidden shadow-neo md:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col"
>
	<div
		class="border-on-background p-md bg-surface flex items-center justify-between border-b-3"
	>
		<h3 class="font-headline-md text-headline-md tracking-tight uppercase">
			Aktivitas Terbaru
		</h3>
		<button class="font-label-sm text-label-sm uppercase hover:underline">
			Lihat Semua
		</button>
	</div>
	<div class="flex flex-col">
		{#each activities as activity}
			<ActivityItem {...activity} />
		{/each}
	</div>
</section>
