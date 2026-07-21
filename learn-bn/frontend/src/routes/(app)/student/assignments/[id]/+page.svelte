<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let assignmentId = $derived($page.params.id as string);
	let assignment = $derived(lmsStore.assignments.find((a) => a.id === assignmentId));
	let studentId = $derived(authState.user?.id || '');
	let submission = $derived(
		lmsStore.assignmentSubmissions.find(
			(s) => s.assignmentId === assignmentId && s.studentId === studentId
		)
	);

	let file: File | null = $state(null);

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			file = target.files[0];
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!file) return;

		lmsStore.submitAssignment({
			assignmentId,
			studentId,
			fileName: file.name
		});

		goto(`/student/classes/${assignment?.classId}`);
	}
</script>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto(`/student/classes/${assignment?.classId}`)}
			>Kembali</Button
		>
		<h2 class="text-2xl font-black">Pengumpulan Tugas</h2>
	</div>

	{#if !assignment}
		<p class="text-error font-bold">Tugas tidak ditemukan.</p>
	{:else}
		<Card class="mb-6 bg-tertiary">
			<h3 class="text-xl font-bold">{assignment.title}</h3>
			<p class="mt-2 text-sm whitespace-pre-wrap">{assignment.description}</p>
			<div class="mt-4">
				<Badge variant="error"
					>Batas Waktu: {new Date(assignment.dueDate).toLocaleString()}</Badge
				>
			</div>
		</Card>

		<Card>
			{#if submission}
				<div class="mb-4 p-4 bg-green-100 border-2 border-on-background">
					<p class="font-bold text-success mb-2">Status: Sudah Mengumpulkan</p>
					<p class="text-sm">File: {submission.fileName}</p>
					<p class="text-xs mt-1">Waktu: {new Date(submission.submittedAt).toLocaleString()}</p>

					{#if submission.grade !== undefined}
						<div class="mt-4 border-t-2 border-on-background pt-4">
							<p class="font-bold text-lg">Nilai Anda: {submission.grade}</p>
							{#if submission.comment}
								<p class="text-sm mt-1">Komentar: "{submission.comment}"</p>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			{#if !submission || submission.grade === undefined}
				<form onsubmit={handleSubmit} class="flex flex-col gap-4">
					<div
						class="flex flex-col gap-1 border-2 border-dashed border-on-background p-4 bg-gray-50"
					>
						<label class="font-bold text-sm flex flex-col gap-2 cursor-pointer">
							<span>Unggah Jawaban (PDF/Gambar/Doc)</span>
							<input type="file" onchange={handleFileChange} required />
						</label>
						{#if file}
							<span class="text-xs font-bold mt-2 text-primary">File terpilih: {file.name}</span>
						{/if}
					</div>

					<div class="flex justify-end mt-2">
						<Button type="submit" variant="primary" disabled={!file}>
							{submission ? 'Perbarui Pengumpulan' : 'Kumpulkan Tugas'}
						</Button>
					</div>
				</form>
			{/if}
		</Card>
	{/if}
</div>
