<script lang="ts">
	let { data, form }: { data: any; form: any } = $props();
</script>

<div class="mb-6">
	<h1 class="text-2xl font-black text-(--text-primary)">Buat Soal</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">
		Pilih ujian untuk mulai membuat soal dan pilihan jawaban.
	</p>
</div>

{#if data.myExams.length === 0}
	<div class="card p-8 text-center font-bold text-(--text-secondary)">
		Anda belum ditugaskan sebagai pembuat soal di ujian manapun.
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.myExams as exam (exam.id)}
			<a href="/supervisor/questions/{exam.id}" class="card p-5 block">
				<div class="flex items-start justify-between mb-3">
					<div
						class="w-10 h-10 flex items-center justify-center shrink-0 bg-primary-100 text-primary-600 rounded-md border-2 border-(--nb-border)"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</div>
					<svg
						class="w-4 h-4 text-(--text-secondary) mt-1"
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
				<h3 class="font-black text-(--text-primary)">{exam.name}</h3>
				<p class="text-sm font-medium text-(--text-secondary) mt-1">
					{exam.examRooms?.length ?? 0} ruangan
				</p>
				<p class="text-xs font-medium text-(--text-secondary) mt-2">
					{new Date(exam.startTime).toLocaleDateString('id-ID', {
						day: 'numeric',
						month: 'short',
						year: 'numeric'
					})}
				</p>
			</a>
		{/each}
	</div>
{/if}
