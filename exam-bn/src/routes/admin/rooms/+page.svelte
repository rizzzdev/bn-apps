<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/modal.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import { addToast } from '$lib/stores/toast';
	import type { PageData, ActionData } from './$types';
	import type { Room } from '$lib/types';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

	let { data }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let editItem = $state<Room | null>(null);
	let roomToRemove = $state<Room | null>(null);
	let removeForm: HTMLFormElement;
	let submitting = $state(false);
	let page = $state(1);
	const PAGE_SIZE = 10;
	const paginatedRooms = $derived(data.rooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));

	function closeModals() {
		showCreate = false;
		editItem = null;
	}

	function makeEnhance(closeOnSuccess = true) {
		return () => {
			submitting = true;
			return async ({ update, result }: any) => {
				submitting = false;
				if (result.type === 'success') {
					if (closeOnSuccess) closeModals();
					addToast(result.data?.message ?? 'Berhasil.', 'success');
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
		<h1 class="text-2xl font-black text-(--text-primary)">Manajemen Ruangan</h1>
		<p class="text-sm font-medium text-(--text-secondary) mt-1">Kelola data ruangan ujian.</p>
	</div>
	<Button onclick={() => (showCreate = true)}>
		<svg class="mr-2 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		Tambah Ruangan
	</Button>
</div>

<Table>
	{#snippet head()}
		<tr>
			<th>Nama Ruangan</th>
			<th>Kapasitas</th>
			<th class="text-right">Aksi</th>
		</tr>
	{/snippet}

	{#each paginatedRooms as room (room.id)}
		<tr>
			<td class="font-black text-(--text-primary) whitespace-nowrap">{room.name}</td>
			<td class="font-medium text-(--text-secondary) whitespace-nowrap">
				{room.capacity != null ? `${room.capacity} Orang` : '-'}
			</td>
			<td class="whitespace-nowrap">
				<div class="flex justify-end gap-1">
					<IconButton variant="primary-outline" title="Edit" onclick={() => (editItem = room)}>
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
								roomToRemove = room;
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

	{#if data.rooms.length === 0}
		<tr>
			<td colspan="3" class="px-5 py-10 text-center font-bold text-(--text-secondary)"
				>Belum ada ruangan.</td
			>
		</tr>
	{/if}

	{#snippet footer()}
		{#if data.rooms.length > PAGE_SIZE}
			<div class="card-footer">
				<Pagination bind:page total={data.rooms.length} pageSize={PAGE_SIZE} />
			</div>
		{/if}
	{/snippet}
</Table>

<!-- Modal Create -->
<Modal show={showCreate} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Tambah Ruangan</h2>
	<form method="POST" action="?/create" class="space-y-3" use:enhance={makeEnhance()}>
		<input name="name" type="text" class="input-field" placeholder="Nama Ruangan" required />
		<input
			name="capacity"
			type="number"
			class="input-field"
			placeholder="Kapasitas (opsional)"
			min="1"
		/>
		<div class="flex justify-end gap-3 pt-2">
			<Button variant="secondary" onclick={closeModals}>Batal</Button>
			<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
		</div>
	</form>
</Modal>

<!-- Modal Edit -->
<Modal show={!!editItem} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Edit Ruangan</h2>
	{#if editItem}
		<form method="POST" action="?/update" class="space-y-3" use:enhance={makeEnhance()}>
			<input type="hidden" name="id" value={editItem.id} />
			<input
				name="name"
				type="text"
				class="input-field"
				placeholder="Nama Ruangan"
				value={editItem.name}
				required
			/>
			<input
				name="capacity"
				type="number"
				class="input-field"
				placeholder="Kapasitas (opsional)"
				min="1"
				value={editItem.capacity ?? ''}
			/>
			<div class="flex justify-end gap-3 pt-2">
				<Button variant="secondary" onclick={closeModals}>Batal</Button>
				<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
			</div>
		</form>
	{/if}
</Modal>

<form bind:this={removeForm} method="POST" action="?/delete" use:enhance={makeEnhance(false)}>
	<input type="hidden" name="id" value={roomToRemove?.id ?? ''} />
</form>

<ConfirmModal
	show={!!roomToRemove}
	title="Konfirmasi Hapus"
	message={`Hapus ruangan ${roomToRemove?.name ?? ''}?`}
	onCancel={() => (roomToRemove = null)}
	onConfirm={() => {
		removeForm.requestSubmit();
		roomToRemove = null;
	}}
/>
