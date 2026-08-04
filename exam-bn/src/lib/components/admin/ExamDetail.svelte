<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { addToast } from '$lib/stores/toast';
	import type { ExamRoom } from '$lib/types';

	let { data, form }: { data: any; form: any } = $props();

	let submitting = $state(false);
	let showAddRoom = $state(false);
	let editRoomItem = $state<ExamRoom | null>(null);
	let roomToRemove = $state<string | null>(null);
	let removeForm: HTMLFormElement;

	let editRoomClassIds = $state<string[]>([]);

	$effect(() => {
		if (editRoomItem) {
			editRoomClassIds = editRoomItem.examRoomClasses?.map((erc: any) => erc.classId) ?? [];
		}
	});

	let roomMap = $derived(new Map((data.rooms ?? []).map((r: any) => [r.id, r])));
	let classMap = $derived(new Map((data.classes ?? []).map((c: any) => [c.id, c])));

	let roomOptions = $derived(
		(data.rooms ?? []).map((room: any) => ({
			value: room.id,
			label: `${room.name}${roomCapacityLabel(room)}`,
			disabled: isRoomFull(room)
		}))
	);

	let classOptions = $derived(
		(data.classes ?? []).map((c: any) => ({
			value: c.id,
			label: c.name
		}))
	);

	function getEditRoomOptions(currentRoomId: string) {
		return (data.rooms ?? []).map((room: any) => ({
			value: room.id,
			label: `${room.name}${roomCapacityLabel(room)}`,
			disabled: isRoomFull(room, currentRoomId)
		}));
	}

	function closeModals() {
		showAddRoom = false;
		editRoomItem = null;
		editRoomClassIds = [];
	}

	// Shows capacity and remaining seats for this room at the exam's time slot,
	// so admins can see availability before picking a room.
	function roomCapacityLabel(room: any): string {
		if (!room.capacity) return '';
		const remaining = room.availability?.remaining;
		if (remaining === undefined || remaining === null) return ` (Kapasitas: ${room.capacity})`;
		const label = ` (Kapasitas: ${remaining}/${room.capacity})`;
		return remaining <= 0 ? `${label} - Penuh` : label;
	}

	// A full room can't be picked — except the room an exam room setup already
	// has, since keeping the current selection doesn't use any extra capacity.
	function isRoomFull(room: any, currentRoomId?: string): boolean {
		if (room.id === currentRoomId) return false;
		const remaining = room.availability?.remaining;
		return remaining !== undefined && remaining !== null && remaining <= 0;
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

<div class="mb-6">
	<a
		href="/admin/exams"
		class="inline-flex items-center gap-1 text-sm font-bold text-primary-500 transition-all duration-100 hover:-translate-x-0.5"
	>
		← Kembali ke Daftar Ujian
	</a>
</div>

{#if data.exam}
	<div class="card p-6 mb-6">
		<h1 class="text-2xl font-black text-(--text-primary)">{data.exam.name}</h1>
		{#if data.exam.description}
			<p class="mt-1 text-(--text-secondary) font-medium">{data.exam.description}</p>
		{/if}
		<div class="mt-4 flex flex-wrap gap-6 text-sm font-medium text-(--text-secondary)">
			<span
				>Mulai: <strong class="font-black text-(--text-primary)"
					>{new Date(data.exam.startTime).toLocaleString('id-ID', {
						timeZone: 'Asia/Jakarta'
					})}</strong
				></span
			>
			<span
				>Selesai: <strong class="font-black text-(--text-primary)"
					>{new Date(data.exam.endTime).toLocaleString('id-ID', {
						timeZone: 'Asia/Jakarta'
					})}</strong
				></span
			>
		</div>
	</div>

	<div class="mb-4 flex justify-between items-center">
		<h2 class="text-lg font-black text-(--text-primary)">Ruangan Ujian</h2>
		<Button onclick={() => (showAddRoom = true)}>+ Tambah Ruangan</Button>
	</div>

	{#if data.examRooms.length === 0}
		<div class="card p-8 text-center font-bold text-(--text-secondary)">
			Belum ada ruangan yang dialokasikan untuk ujian ini.
		</div>
	{:else}
		<div class="grid gap-4">
			{#each data.examRooms as er (er.id)}
				{@const assignedClasses = (er.examRoomClasses ?? []).map((erc: any) => classMap.get(erc.classId)).filter(Boolean)}
				<div class="card p-5 flex items-center justify-between">
					<div>
						<h3 class="text-base font-black text-(--text-primary)">
							Ruangan: {er.room?.name ?? er.roomId}
						</h3>
						<div class="flex items-center gap-1.5 mt-1 flex-wrap">
							<span class="text-xs font-bold text-(--text-secondary)">Kelas:</span>
							{#if assignedClasses.length > 0}
								{#each assignedClasses as c}
									<span class="text-xs font-bold px-2 py-0.5 rounded border border-(--nb-border) bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200">
										{c.name}
									</span>
								{/each}
							{:else}
								<span class="text-xs font-bold text-red-600">⚠️ Belum set kelas (0 murid)</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-1">
						<IconButton
							variant="primary-outline"
							title="Pantau Ruangan"
							href="/admin/exams/{data.exam.id}/rooms/{er.id}"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						</IconButton>
						<IconButton
							variant="primary-outline"
							title="Kelola Peserta & Pengawas"
							href="/admin/exams/{data.exam.id}/rooms/{er.id}/participants-and-supervisors"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</IconButton>
						<IconButton
							variant="primary-outline"
							title="Edit Ruangan"
							onclick={() => (editRoomItem = er)}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</IconButton>
						<form method="POST" action="?/removeRoom" use:enhance={makeEnhance(false)}>
							<input type="hidden" name="id" value={er.id} />
							<IconButton
								variant="danger-outline"
								title="Hapus Ruangan"
								type="button"
								onclick={(e) => {
									e.preventDefault();
									roomToRemove = er.id;
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
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else}
	<div class="card p-8 text-center font-bold text-(--text-secondary)">Ujian tidak ditemukan.</div>
{/if}

<!-- Modal Add Room -->
<Modal show={showAddRoom} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Tambah Ruangan</h2>
	<form method="POST" action="?/addRoom" class="space-y-4" use:enhance={makeEnhance()}>
		<input type="hidden" name="examId" value={data.examId} />
		<Select name="roomId" label="Ruangan" options={roomOptions} required placeholder="-- Pilih Ruangan --" />
		<Select
			name="classIds"
			label="Alokasi Kelas"
			options={classOptions}
			multiple={true}
			placeholder="-- Pilih Kelas (Multiple) --"
			hint="Hanya siswa aktif pada kelas yang dipilih yang dapat dijadikan peserta ujian di ruangan ini."
		/>
		<div class="flex justify-end gap-3 pt-2">
			<Button variant="secondary" onclick={closeModals}>Batal</Button>
			<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
		</div>
	</form>
</Modal>

<!-- Modal Edit Room -->
<Modal show={!!editRoomItem} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Edit Ruangan</h2>
	{#if editRoomItem}
		<form method="POST" action="?/updateRoom" class="space-y-4" use:enhance={makeEnhance()}>
			<input type="hidden" name="id" value={editRoomItem.id} />
			<Select
				name="roomId"
				label="Ganti Ruangan"
				value={editRoomItem.roomId}
				options={getEditRoomOptions(editRoomItem.roomId)}
				required
			/>
			<Select
				name="classIds"
				label="Alokasi Kelas"
				value={editRoomClassIds}
				options={classOptions}
				multiple={true}
				placeholder="-- Pilih Kelas (Multiple) --"
				hint="Siswa dari kelas yang dilepas akan otomatis dicabut (soft-delete) dari peserta ruangan ini."
			/>
			<div class="flex justify-end gap-3 pt-2">
				<Button variant="secondary" onclick={closeModals}>Batal</Button>
				<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
			</div>
		</form>
	{/if}
</Modal>

<form bind:this={removeForm} method="POST" action="?/removeRoom" use:enhance={makeEnhance(false)}>
	<input type="hidden" name="id" value={roomToRemove} />
</form>

<ConfirmModal
	show={!!roomToRemove}
	title="Konfirmasi Hapus"
	message="Hapus ruangan dari ujian ini?"
	onCancel={() => (roomToRemove = null)}
	onConfirm={() => {
		removeForm.requestSubmit();
		roomToRemove = null;
	}}
/>
