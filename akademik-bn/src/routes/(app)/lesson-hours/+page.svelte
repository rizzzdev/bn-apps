<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import { PageHeader, Modal, TooltipIconButton } from '$lib/components/molecules';
	import {
		DataTable,
		TableHead,
		TableHeadCell,
		TableBody,
		TableRow,
		TableCell
	} from '$lib/components/organisms/table';
	import { lessonHourApi } from '$lib/services';
	import type { LessonHour } from '$lib/types';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let lessonHours = $state<LessonHour[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	// Create / Edit modal
	let isFormOpen = $state(false);
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formStartTime = $state('07:00');
	let formEndTime = $state('07:45');
	let formOrder = $state(1);
	let isSaving = $state(false);

	// Delete
	let isDeleteOpen = $state(false);
	let deletingId = $state<string | null>(null);

	async function loadData() {
		isLoading = true;
		error = '';
		try {
			const res = await lessonHourApi.list(1, 50);
			if (res.data) lessonHours = res.data as LessonHour[];
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data');
		} finally {
			isLoading = false;
		}
	}

	function openCreate() {
		editingId = null;
		formName = '';
		formStartTime = '07:00';
		formEndTime = '07:45';
		formOrder = lessonHours.length + 1;
		isFormOpen = true;
	}

	function openEdit(lh: LessonHour) {
		editingId = lh.id;
		formName = lh.name;
		formStartTime = lh.startTime;
		formEndTime = lh.endTime;
		formOrder = lh.order;
		isFormOpen = true;
	}

	async function handleSave() {
		if (!formName) {
			toast.error('Nama jam pelajaran wajib diisi');
			return;
		}
		if (formStartTime >= formEndTime) {
			toast.error('Jam mulai harus sebelum jam selesai');
			return;
		}

		isSaving = true;
		try {
			if (editingId) {
				await lessonHourApi.update(editingId, {
					name: formName,
					startTime: formStartTime,
					endTime: formEndTime,
					order: formOrder
				});
				toast.success('Jam pelajaran berhasil diperbarui');
			} else {
				await lessonHourApi.create({
					name: formName,
					startTime: formStartTime,
					endTime: formEndTime,
					order: formOrder
				});
				toast.success('Jam pelajaran berhasil ditambahkan');
			}
			isFormOpen = false;
			await loadData();
		} catch {
			toast.error('Gagal menyimpan');
		} finally {
			isSaving = false;
		}
	}

	function confirmDelete(id: string) {
		deletingId = id;
		isDeleteOpen = true;
	}

	async function handleDelete() {
		if (!deletingId) return;
		try {
			await lessonHourApi.delete(deletingId);
			toast.success('Jam pelajaran berhasil dihapus');
			isDeleteOpen = false;
			deletingId = null;
			await loadData();
		} catch {
			toast.error('Gagal menghapus');
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Jam Pelajaran - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title="Jam Pelajaran" description="KELOLA STANDAR WAKTU JAM PELAJARAN" />
	<!-- Toolbar -->
	<div class="flex flex-row items-center justify-end gap-2">
		<TooltipIconButton
			icon="add"
			tooltip="Tambah Jam Pelajaran"
			onclick={openCreate}
			variant="primary"
		/>
	</div>

	<DataTable
		{isLoading}
		{error}
		isEmpty={lessonHours.length === 0}
		emptyMessage="Belum ada jam pelajaran"
	>
		<table class="w-full text-left border-collapse">
			<TableHead>
				<TableRow>
					<TableHeadCell width="w-[6%]" align="center">No</TableHeadCell>
					<TableHeadCell>Nama</TableHeadCell>
					<TableHeadCell>Jam Mulai</TableHeadCell>
					<TableHeadCell>Jam Selesai</TableHeadCell>
					<TableHeadCell align="center">Urutan</TableHeadCell>
					<TableHeadCell align="center">Aksi</TableHeadCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{#each lessonHours as lh, i}
					<TableRow>
						<TableCell align="center"><span class="font-bold">{i + 1}</span></TableCell>
						<TableCell><span class="font-bold">{lh.name}</span></TableCell>
						<TableCell>{lh.startTime}</TableCell>
						<TableCell>{lh.endTime}</TableCell>
						<TableCell align="center">{lh.order}</TableCell>
						<TableCell align="center">
							<div class="flex justify-center gap-2">
								<TooltipIconButton
									icon="edit"
									tooltip="Edit"
									onclick={() => openEdit(lh)}
									variant="ghost"
								/>
								<TooltipIconButton
									icon="delete"
									tooltip="Hapus"
									onclick={() => confirmDelete(lh.id)}
									variant="danger"
								/>
							</div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</table>
	</DataTable>
</div>

<!-- Create/Edit Modal -->
<Modal bind:isOpen={isFormOpen} title={editingId ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}>
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<label class="font-label-caps text-xs uppercase font-bold text-on-surface-variant" for="name"
				>Nama Jam</label
			>
			<input
				id="name"
				type="text"
				bind:value={formName}
				placeholder="Jam ke-1"
				class="w-full bg-surface-container-lowest neo-border h-8 px-3 font-data-mono text-xs text-on-background focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
			/>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-1">
				<label
					class="font-label-caps text-xs uppercase font-bold text-on-surface-variant"
					for="start-time">Jam Mulai</label
				>
				<input
					id="start-time"
					type="time"
					bind:value={formStartTime}
					class="w-full bg-surface-container-lowest neo-border h-8 px-3 font-data-mono text-xs text-on-background focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label
					class="font-label-caps text-xs uppercase font-bold text-on-surface-variant"
					for="end-time">Jam Selesai</label
				>
				<input
					id="end-time"
					type="time"
					bind:value={formEndTime}
					class="w-full bg-surface-container-lowest neo-border h-8 px-3 font-data-mono text-xs text-on-background focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
				/>
			</div>
		</div>
		<div class="flex flex-col gap-1">
			<label class="font-label-caps text-xs uppercase font-bold text-on-surface-variant" for="order"
				>Urutan</label
			>
			<input
				id="order"
				type="number"
				bind:value={formOrder}
				min="1"
				class="w-full bg-surface-container-lowest neo-border h-8 px-3 font-data-mono text-xs text-on-background focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
			/>
		</div>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isFormOpen = false)} disabled={isSaving}>Batal</Button>
		<Button variant="primary" onclick={handleSave} disabled={isSaving}>
			{isSaving ? 'Menyimpan...' : 'Simpan'}
		</Button>
	{/snippet}
</Modal>

<!-- Delete Confirmation -->
<Modal bind:isOpen={isDeleteOpen} title="Konfirmasi Hapus">
	<p class="font-body-md text-body-md">Yakin ingin menghapus jam pelajaran ini?</p>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isDeleteOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleDelete}>Hapus</Button>
	{/snippet}
</Modal>
