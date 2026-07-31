<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let assignmentId = $derived($page.params.id as string);

	let submissions: Awaited<ReturnType<typeof lmsStore.getSubmissions>> = $state([]);
	let grades: Record<string, { grade: number; feedback: string }> = $state({});
	let loading = $state(true);
	let submitting = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	$effect(() => {
		async function load() {
			loading = true;
			try {
				submissions = await lmsStore.getSubmissions(assignmentId);
				for (const sub of submissions) {
					if (sub.id) {
						grades[sub.id] = { grade: sub.grade ?? 0, feedback: sub.feedback ?? '' };
					}
				}
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat pengumpulan';
			} finally {
				loading = false;
			}
		}
		load();
	});

	async function handleSubmitAll() {
		submitting = true;
		errorMsg = '';
		successMsg = '';
		try {
			const bulkData = Object.entries(grades).map(([submissionId, g]) => ({
				submissionId,
				grade: g.grade,
				feedback: g.feedback || undefined,
			}));
			await lmsStore.bulkGrade(bulkData);
			successMsg = 'Semua nilai berhasil disimpan!';
		} catch (err: any) {
			errorMsg = err.message || 'Gagal menyimpan nilai';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="max-w-4xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto(`/teacher/assignments/${assignmentId}`)}>Kembali</Button>
		<h2 class="text-2xl font-black">Penilaian Tugas</h2>
	</div>

	{#if loading}
		<div class="bg-surface-container-lowest neo-border p-12 text-center">
			<span class="material-symbols-outlined text-4xl text-secondary mb-2">hourglass</span>
			<p class="font-bold text-secondary">Memuat pengumpulan...</p>
		</div>
	{:else}
		{#if errorMsg}
			<div class="bg-surface-container p-4 neo-border mb-4">
				<p class="font-bold text-error">{errorMsg}</p>
			</div>
		{/if}
		{#if successMsg}
			<div class="bg-success/20 p-4 neo-border mb-4 border-success">
				<p class="font-bold text-success">{successMsg}</p>
			</div>
		{/if}

		{#if submissions.length === 0}
			<div class="bg-surface-container-lowest neo-border p-12 text-center">
				<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
				<p class="font-bold text-secondary text-lg">Belum ada pengumpulan.</p>
			</div>
		{:else}
			<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="bg-surface-container font-label-bold text-sm text-left">
								<th class="neo-border p-3">Nama Siswa</th>
								<th class="neo-border p-3">Status</th>
								<th class="neo-border p-3">Nilai (0-100)</th>
								<th class="neo-border p-3">Feedback</th>
							</tr>
						</thead>
						<tbody>
							{#each submissions.filter((s): s is typeof s & { id: string } => !!s.id) as sub}
								<tr class="border-b-2 border-on-surface">
									<td class="p-3 font-label-bold">{sub.student?.fullname || sub.studentId}</td>
									<td class="p-3">
										{#if sub.grade !== null}
											<Badge variant="success" icon="check_circle" text="Sudah Dinilai" />
										{:else}
											<Badge variant="error" icon="error" text="Belum Dinilai" />
										{/if}
									</td>
									<td class="p-3">
										<input
											type="number"
											min="0"
											max="100"
											bind:value={grades[sub.id].grade}
											class="w-20 bg-surface-container-lowest neo-border px-2 py-1 text-center font-label-bold"
										/>
									</td>
									<td class="p-3">
										<textarea
											bind:value={grades[sub.id].feedback}
											placeholder="Feedback (opsional)"
											class="w-full bg-surface-container-lowest neo-border px-2 py-1 text-sm font-body-md"
											rows="2"
										></textarea>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<div class="mt-6 flex justify-end">
				<Button variant="primary" onclick={handleSubmitAll} disabled={submitting}>
					{submitting ? 'Menyimpan...' : 'Simpan Semua Nilai'}
				</Button>
			</div>
		{/if}
	{/if}
</div>
