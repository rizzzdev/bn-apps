<script lang="ts">
	let { data, form }: { data: any; form: any } = $props();

	const WIB: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Jakarta',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	};
	const statusLabel: Record<string, string> = {
		PENDING: 'Belum Mulai',
		ONGOING: 'Berlangsung',
		ENDED: 'Selesai'
	};
	const statusClass: Record<string, string> = {
		PENDING: 'badge-warning',
		ONGOING: 'badge-success',
		ENDED: ''
	};
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Koreksi Esai</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">
		Pilih ruang ujian untuk menilai jawaban esai peserta.
	</p>
</div>

{#if data.myExamRooms.length === 0}
	<div class="card p-10 text-center font-bold text-(--text-secondary)">
		Belum ada ruang ujian dari soal yang Anda buat.
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.myExamRooms as er (er.id)}
			<a
				href="/supervisor/grading/{er.id}"
				class="card p-5 block transition-all duration-100 hover:translate-x-1 hover:translate-y-1 hover:[box-shadow:1px_1px_0_0_var(--nb-shadow)]"
			>
				<div class="flex items-start justify-between mb-3">
					<span class="badge {statusClass[er.status] ?? 'badge-warning'} font-black">
						{statusLabel[er.status] ?? er.status}
					</span>
					<svg
						class="w-4 h-4 text-(--text-secondary)"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</div>
				<h3 class="font-black text-(--text-primary)">{er.exam?.name ?? '-'}</h3>
				<p class="text-sm font-medium text-(--text-secondary) mt-1">
					Ruangan: {er.room?.name ?? '-'}
				</p>
				<p class="text-xs font-medium text-(--text-secondary) mt-2">
					{er.exam ? new Date(er.exam.startTime).toLocaleDateString('id-ID', WIB) : '-'}
				</p>
			</a>
		{/each}
	</div>
{/if}
