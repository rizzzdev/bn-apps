<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/modal.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import { addToast } from '$lib/stores/toast';
	import type { Exam } from '$lib/types';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

	let { data, form }: { data: any; form: any } = $props();

	let showCreate = $state(false);
	let editItem = $state<Exam | null>(null);
	let examToRemove = $state<Exam | null>(null);
	let removeForm: HTMLFormElement;
	let submitting = $state(false);
	let page = $state(1);
	const PAGE_SIZE = 10;
	const paginatedExams = $derived(
		(data.exams ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	);

	function closeModals() {
		showCreate = false;
		editItem = null;
	}

	function toDatetimeLocal(iso: string) {
		if (!iso) return '';
		const wib = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
		return wib.toISOString().slice(0, 16);
	}

	function makeEnhance(closeOnSuccess = true) {
		return () => {
			submitting = true;
			return async ({ update, result }: any) => {
				submitting = false;
				if (result.type === 'success') {
					if (closeOnSuccess) closeModals();
					addToast(result.data?.message ?? 'Berhasil disimpan.', 'success');
				} else if (result.type === 'failure') {
					addToast(result.data?.error ?? 'Terjadi kesalahan.', 'error');
				}
				await update();
			};
		};
	}
</script>

<div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
	<div>
		<h1 class="text-2xl font-black text-(--text-primary)">Manajemen Ujian</h1>
		<p class="text-sm font-medium text-(--text-secondary) mt-1">
			Kelola bank soal dan detail ujian.
		</p>
	</div>
	<Button onclick={() => (showCreate = true)}>
		<svg class="mr-2 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		Buat Ujian
	</Button>
</div>

<Table>
	{#snippet head()}
		<tr>
			<th>Nama Ujian</th>
			<th>Waktu Mulai</th>
			<th>Waktu Selesai</th>
			<th class="text-right">Aksi</th>
		</tr>
	{/snippet}

	{#each paginatedExams as exam (exam.id)}
		<tr>
			<td class="font-black text-(--text-primary) whitespace-nowrap">{exam.name}</td>
			<td class="font-medium text-(--text-secondary) whitespace-nowrap">
				{new Date(exam.startTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
			</td>
			<td class="font-medium text-(--text-secondary) whitespace-nowrap">
				{new Date(exam.endTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
			</td>
			<td class="whitespace-nowrap">
				<div class="flex justify-end gap-1">
					<IconButton
						variant="primary-outline"
						title="Kelola Ruangan"
						href="/admin/exams/{exam.id}/rooms"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</IconButton>
					<IconButton variant="primary-outline" title="Edit" onclick={() => (editItem = exam)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</IconButton>
						<IconButton
							variant="danger-outline"
							title="Hapus"
							type="button"
							onclick={(e) => {
								e.preventDefault();
								examToRemove = exam;
							}}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</IconButton>
				</div>
			</td>
		</tr>
	{/each}

	{#if (data.exams ?? []).length === 0}
		<tr>
			<td colspan="4" class="px-5 py-10 text-center font-bold text-(--text-secondary)"
				>Belum ada ujian.</td
			>
		</tr>
	{/if}

	{#snippet footer()}
		{#if (data.exams ?? []).length > PAGE_SIZE}
			<div class="card-footer">
				<Pagination bind:page total={(data.exams ?? []).length} pageSize={PAGE_SIZE} />
			</div>
		{/if}
	{/snippet}
</Table>

<!-- Modal Create -->
<Modal show={showCreate} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Buat Ujian</h2>
	<form method="POST" action="?/create" class="space-y-3" use:enhance={makeEnhance()}>
		<input name="name" type="text" class="input-field" placeholder="Nama Ujian" required />
		<textarea name="description" class="input-field" placeholder="Deskripsi (opsional)" rows="3"
		></textarea>
		<div>
			<label
				for="create-questionCreatorId"
				class="block text-sm font-black text-(--text-primary) mb-1"
				>Pembuat Soal <span class="font-medium text-(--text-secondary)">(opsional)</span></label
			>
			<select id="create-questionCreatorId" name="questionCreatorId" class="input-field">
				<option value="">-- Pilih Pembuat Soal --</option>
				{#if data.supervisors}
					{#each data.supervisors as supervisor (supervisor.id)}
						<option value={supervisor.id}>{supervisor.fullname}</option>
					{/each}
				{/if}
			</select>
		</div>
		<div>
			<label for="create-startTime" class="block text-sm font-black text-(--text-primary) mb-1"
				>Waktu Mulai <span class="font-medium text-(--text-secondary)">(WIB)</span></label
			>
			<input
				id="create-startTime"
				name="startTime"
				type="datetime-local"
				class="input-field"
				required
			/>
		</div>
		<div>
			<label for="create-endTime" class="block text-sm font-black text-(--text-primary) mb-1"
				>Waktu Selesai <span class="font-medium text-(--text-secondary)">(WIB)</span></label
			>
			<input
				id="create-endTime"
				name="endTime"
				type="datetime-local"
				class="input-field"
				required
			/>
		</div>
		<div>
			<label for="create-passingGrade" class="block text-sm font-black text-(--text-primary) mb-1"
				>Nilai KKM <span class="font-medium text-(--text-secondary)">(Passing Grade)</span></label
			>
			<input
				id="create-passingGrade"
				name="passingGrade"
				type="number"
				min="0"
				max="100"
				class="input-field"
				placeholder="75"
				value="75"
			/>
		</div>
		<div class="flex justify-end gap-3 pt-2">
			<Button variant="secondary" onclick={closeModals}>Batal</Button>
			<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
		</div>
	</form>
</Modal>

<!-- Modal Edit -->
<Modal show={!!editItem} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Edit Ujian</h2>
	{#if editItem}
		<form method="POST" action="?/update" class="space-y-3" use:enhance={makeEnhance()}>
			<input type="hidden" name="id" value={editItem.id} />
			<input
				name="name"
				type="text"
				class="input-field"
				placeholder="Nama Ujian"
				value={editItem.name}
				required
			/>
			<textarea name="description" class="input-field" placeholder="Deskripsi (opsional)" rows="3"
				>{editItem.description ?? ''}</textarea
			>
			<div>
				<label
					for="edit-questionCreatorId"
					class="block text-sm font-black text-(--text-primary) mb-1"
					>Pembuat Soal <span class="font-medium text-(--text-secondary)">(opsional)</span></label
				>
				<select
					id="edit-questionCreatorId"
					name="questionCreatorId"
					class="input-field"
					value={editItem.questionCreatorId ?? ''}
				>
					<option value="">-- Pilih Pembuat Soal --</option>
					{#if data.supervisors}
						{#each data.supervisors as supervisor (supervisor.id)}
							<option value={supervisor.id}>{supervisor.fullname}</option>
						{/each}
					{/if}
				</select>
			</div>
			<div>
				<label for="edit-startTime" class="block text-sm font-black text-(--text-primary) mb-1"
					>Waktu Mulai <span class="font-medium text-(--text-secondary)">(WIB)</span></label
				>
				<input
					id="edit-startTime"
					name="startTime"
					type="datetime-local"
					class="input-field"
					value={toDatetimeLocal(editItem.startTime)}
					required
				/>
			</div>
			<div>
				<label for="edit-endTime" class="block text-sm font-black text-(--text-primary) mb-1"
					>Waktu Selesai <span class="font-medium text-(--text-secondary)">(WIB)</span></label
				>
				<input
					id="edit-endTime"
					name="endTime"
					type="datetime-local"
					class="input-field"
					value={toDatetimeLocal(editItem.endTime)}
					required
				/>
			</div>
			<div>
				<label for="edit-passingGrade" class="block text-sm font-black text-(--text-primary) mb-1"
					>Nilai KKM <span class="font-medium text-(--text-secondary)">(Passing Grade)</span></label
				>
				<input
					id="edit-passingGrade"
					name="passingGrade"
					type="number"
					min="0"
					max="100"
					class="input-field"
					value={editItem.passingGrade ?? 75}
				/>
			</div>
			<div class="flex justify-end gap-3 pt-2">
				<Button variant="secondary" onclick={closeModals}>Batal</Button>
				<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
			</div>
		</form>
	{/if}
</Modal>

<form bind:this={removeForm} method="POST" action="?/delete" use:enhance={makeEnhance(false)}>
	<input type="hidden" name="id" value={examToRemove?.id ?? ''} />
</form>

<ConfirmModal
	show={!!examToRemove}
	title="Konfirmasi Hapus"
	message={`Hapus ujian ${examToRemove?.name ?? ''}?`}
	onCancel={() => (examToRemove = null)}
	onConfirm={() => {
		removeForm.requestSubmit();
		examToRemove = null;
	}}
/>
