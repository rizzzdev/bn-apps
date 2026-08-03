<script lang="ts">
	import { Modal, SelectField } from '$lib/components/molecules';
	import { ConfirmationModal } from '$lib/components/organisms';
	import {
		Table,
		TableHead,
		TableBody,
		TableRow,
		TableHeadCell,
		TableCell
	} from '$lib/components/organisms/table';
	import { Button, Icon, Badge, ActionButton } from '$lib/components/atoms';
	import { toast } from '$lib/stores/toast.svelte';
	import { apiClient } from '$lib/utils/api';

	let {
		isOpen = $bindable(false),
		academicYear = null,
		onUpdate = () => {}
	} = $props<{
		isOpen: boolean;
		academicYear: import('$lib/types').AcademicYear | null;
		onUpdate?: () => void;
	}>();

	let semesters = $derived(academicYear?.semesters || []);

	let isCreateOpen = $state(false);
	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let selectedSemester = $state<import('$lib/types').Semester | null>(null);

	let formData = $state({
		type: '',
		code: '',
		status: ''
	});

	$effect(() => {
		if (isCreateOpen) {
			formData = { type: '', code: '', status: '' };
		}
	});

	function openEdit(semester: import('$lib/types').Semester) {
		selectedSemester = semester;
		formData = {
			type: semester.type || '',
			code: (semester as { code?: string }).code || '',
			status: semester.status || ''
		};
		isEditOpen = true;
	}

	function openDelete(semester: import('$lib/types').Semester) {
		selectedSemester = semester;
		isDeleteOpen = true;
	}

	async function handleSave() {
		try {
			const payload = { ...formData, academicYearId: academicYear.id };
			if (isCreateOpen) {
				const res = await apiClient('/semesters', {
					method: 'POST',
					body: JSON.stringify(payload)
				});
				const result = await res.json();
				if (!result.error) {
					toast.success('Semester berhasil ditambahkan!');
					isCreateOpen = false;
					onUpdate();
				} else {
					toast.error(result.message || 'Gagal menambahkan semester');
				}
			} else if (isEditOpen && selectedSemester) {
				const res = await apiClient(`/semesters/${selectedSemester.id}`, {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				const result = await res.json();
				if (!result.error) {
					toast.success('Data semester berhasil diperbarui!');
					isEditOpen = false;
					onUpdate();
				} else {
					toast.error(result.message || 'Gagal memperbarui semester');
				}
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleDelete() {
		try {
			if (!selectedSemester) return;
			const res = await apiClient(`/semesters/${selectedSemester.id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!result.error) {
				toast.success('Data semester berhasil dihapus!');
				isDeleteOpen = false;
				onUpdate();
			} else {
				toast.error(result.message || 'Gagal menghapus semester');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}
</script>

<Modal bind:isOpen title={`Kelola Semester - ${academicYear?.code || ''}`}>
	<div class="mb-md flex justify-between items-center">
		<h3 class="font-body-bold text-body-bold">Daftar Semester</h3>
		<Button variant="secondary" class="gap-xs w-auto" onclick={() => (isCreateOpen = true)}>
			<Icon name="add" class="text-base" fill={0} />
			Tambah Semester
		</Button>
	</div>

	<Table class="mb-0">
		<TableHead>
			<TableRow header>
				<TableHeadCell>Tipe</TableHeadCell>
				<TableHeadCell>Kode</TableHeadCell>
				<TableHeadCell>Status</TableHeadCell>
				<TableHeadCell width="w-32" align="center">Aksi</TableHeadCell>
			</TableRow>
		</TableHead>
		<TableBody>
			{#each semesters as semester, i (semester.id)}
				<TableRow striped={i % 2 !== 0}>
					<TableCell class="font-body-bold text-body-bold">{semester.type}</TableCell>
					<TableCell>{semester.academicYear?.code || academicYear?.code}</TableCell>
					<TableCell>
						{#if semester.status === 'Aktif'}
							<Badge color="#BBF7D0" class="text-xs">Aktif</Badge>
						{:else if semester.status === 'Tidak_Aktif'}
							<Badge color="#FECACA" class="text-xs">Tidak Aktif</Badge>
						{:else}
							<Badge color="#BFDBFE" class="text-xs">Selesai</Badge>
						{/if}
					</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<ActionButton icon="edit" title="Edit" onclick={() => openEdit(semester)} />
							<ActionButton
								icon="delete"
								title="Hapus"
								variant="danger"
								onclick={() => openDelete(semester)}
							/>
						</div>
					</TableCell>
				</TableRow>
			{/each}
			{#if semesters.length === 0}
				<TableRow>
					<TableCell colspan={4} align="center" class="py-md text-on-surface-variant">
						Belum ada data semester untuk tahun ajaran ini.
					</TableCell>
				</TableRow>
			{/if}
		</TableBody>
	</Table>

	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Tutup</Button
		>
	{/snippet}
</Modal>

<!-- Sub-Modals for Semester CRUD -->
<Modal bind:isOpen={isCreateOpen} title="Tambah Semester">
	<div class="flex flex-col gap-sm">
		<SelectField
			id="type-create"
			label="Tipe Semester"
			bind:value={formData.type}
			options={[
				{ value: 'Ganjil', label: 'Ganjil' },
				{ value: 'Genap', label: 'Genap' }
			]}
		/>
		<SelectField
			id="status-create"
			label="Status"
			bind:value={formData.status}
			options={[
				{ value: 'Aktif', label: 'Aktif' },
				{ value: 'Tidak_Aktif', label: 'Tidak Aktif' },
				{ value: 'Selesai', label: 'Selesai' }
			]}
		/>
	</div>
	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isCreateOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button
		>
		<Button variant="info" onclick={handleSave}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Semester">
	<div class="flex flex-col gap-sm">
		<SelectField
			id="type-edit"
			label="Tipe Semester"
			bind:value={formData.type}
			options={[
				{ value: 'Ganjil', label: 'Ganjil' },
				{ value: 'Genap', label: 'Genap' }
			]}
		/>
		<SelectField
			id="status-edit"
			label="Status"
			bind:value={formData.status}
			options={[
				{ value: 'Aktif', label: 'Aktif' },
				{ value: 'Tidak_Aktif', label: 'Tidak Aktif' },
				{ value: 'Selesai', label: 'Selesai' }
			]}
		/>
	</div>
	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isEditOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button
		>
		<Button variant="info" onclick={handleSave}>Simpan Perubahan</Button>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isDeleteOpen}
	type="danger"
	title="Hapus Semester"
	message={`Apakah Anda yakin ingin menghapus semester ${selectedSemester?.type}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>
