<script lang="ts">
	import { Button, Icon } from '$lib/components/atoms';
	import { SearchBar } from '$lib/components/molecules';
	import { SubjectDetailHeader, TeacherCard } from '$lib/features/subject';
	import { subjectApi, teacherApi } from '$lib/services';
	import type { ShadowSubject, SubjectTeacher, ShadowTeacher } from '$lib/types';
	import { Modal, SearchableSelect, TooltipIconButton } from '$lib/components/molecules';
	import { toast } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let id = $derived($page.params.id ?? '');
	let subject = $state<{
		id: string;
		name: string;
		code: string;
		totalTeachers: number;
	} | null>(null);
	let teachers = $state<{
		id: string;
		fullname: string;
		nip: string;
		pictureUrl?: string | null;
		subjectTeacherId: string;
	}[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	let allTeachers = $state<ShadowTeacher[]>([]);
	let subjectTeacherMap = $state<Record<string, string>>({});

	let searchQuery = $state('');

	// Add Teacher mapping modal
	let isAddTeacherOpen = $state(false);
	let addTeacherIds = $state<string[]>([]);

	// Bulk selection
	let bulkSelectedTeacherIds = $state<string[]>([]);

	// Bulk action modal
	let isBulkActionOpen = $state(false);
	let bulkActionType = $state<'nonaktifkan' | 'delete'>('nonaktifkan');

	let filteredTeachers = $derived(
		teachers.filter(
			(t) =>
				t.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.nip.includes(searchQuery)
		)
	);

	function selectAllTeachers() {
		if (bulkSelectedTeacherIds.length === filteredTeachers.length && filteredTeachers.length > 0) {
			bulkSelectedTeacherIds = [];
		} else {
			bulkSelectedTeacherIds = filteredTeachers.map((t) => t.id);
		}
	}

	function toggleTeacherSelection(id: string) {
		if (bulkSelectedTeacherIds.includes(id)) {
			bulkSelectedTeacherIds = bulkSelectedTeacherIds.filter((s) => s !== id);
		} else {
			bulkSelectedTeacherIds = [...bulkSelectedTeacherIds, id];
		}
	}

	function openAddTeacher() {
		addTeacherIds = [];
		isAddTeacherOpen = true;
	}

	async function handleAddTeacher() {
		if (addTeacherIds.length === 0 || !id) {
			toast.error('Pilih minimal 1 guru');
			return;
		}
		try {
			for (const teacherId of addTeacherIds) {
				await teacherApi.subjectTeachers.create({
					teacherId,
					subjectId: id,
					status: 'Aktif'
				});
			}
			toast.success(`${addTeacherIds.length} guru berhasil ditambahkan`);
			isAddTeacherOpen = false;
			addTeacherIds = [];
			await fetchTeachers();
		} catch (e) {
			toast.error('Gagal menambahkan guru');
		}
	}

	function openBulkAction() {
		if (bulkSelectedTeacherIds.length === 0) {
			toast.error('Silakan pilih guru dengan mencentang kotaknya terlebih dahulu');
			return;
		}
		bulkActionType = 'nonaktifkan';
		isBulkActionOpen = true;
	}

	async function handleBulkAction() {
		if (bulkSelectedTeacherIds.length === 0) return;
		try {
			const stIds = bulkSelectedTeacherIds
				.map((id) => subjectTeacherMap[id])
				.filter(Boolean);
			if (stIds.length === 0) {
				toast.error('Tidak ada data yang bisa diproses');
				return;
			}

			let res;
			if (bulkActionType === 'nonaktifkan') {
				res = await teacherApi.subjectTeachers.bulkStatus(stIds, 'TidakAktif');
				toast.success(`${res?.data?.updated ?? stIds.length} guru berhasil dinonaktifkan`);
			} else if (bulkActionType === 'delete') {
				res = await teacherApi.subjectTeachers.bulkDelete(stIds);
				toast.success(`${res?.data?.deleted ?? stIds.length} guru berhasil dihapus`);
			}

			isBulkActionOpen = false;
			bulkSelectedTeacherIds = [];
			await fetchTeachers();
		} catch {
			toast.error('Gagal memproses aksi massal');
		}
	}

	async function fetchTeachers() {
		if (!id) return;
		const stRes = await teacherApi.subjectTeachers.listBySubject(id);
		if (stRes.data) {
			const activeSubjectTeachers = stRes.data.filter(
				(st: SubjectTeacher) => st.subjectId === id && st.status === 'Aktif' && !st.deletedAt
			);

			subjectTeacherMap = activeSubjectTeachers.reduce(
				(acc: Record<string, string>, st: SubjectTeacher) => {
					acc[st.teacherId] = st.id;
					return acc;
				},
				{} as Record<string, string>
			);

			teachers = activeSubjectTeachers.map((st: SubjectTeacher) => {
				const teacher = allTeachers.find((t) => t.id === st.teacherId);
				return {
					id: st.teacherId,
					fullname: teacher?.fullname ?? st.teacherId,
					nip: teacher?.nip ?? '-',
					pictureUrl: teacher?.pictureUrl ?? null,
					subjectTeacherId: st.id
				};
			});

			if (subject) {
				subject.totalTeachers = teachers.length;
			}
		}
	}

	onMount(async () => {
		isLoading = true;
		if (!id) {
			error = 'ID tidak valid';
			isLoading = false;
			return;
		}
		try {
			const [subjRes, teacherListRes] = await Promise.all([
				subjectApi.getById(id),
				teacherApi.list(1, 1000)
			]);

			if (teacherListRes.data) {
				allTeachers = teacherListRes.data as ShadowTeacher[];
			}

			if (subjRes.data) {
				const s = subjRes.data as ShadowSubject;
				subject = {
					id: s.id,
					name: s.name,
					code: s.code,
					totalTeachers: 0
				};
			}

			await fetchTeachers();
		} catch (e) {
			error = 'Gagal memuat data mata pelajaran';
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="container mx-auto px-4 py-8">
	{#if isLoading}
		<div class="text-center py-xl">
			<p class="font-data-mono text-data-mono text-on-surface-variant">Memuat data...</p>
		</div>
	{:else if error}
		<div class="text-center py-xl">
			<h2 class="font-headline-md text-headline-md text-error">Terjadi Kesalahan</h2>
			<p class="font-data-mono text-data-mono text-on-surface-variant mt-2">{error}</p>
			<a href="/subject" class="font-data-mono text-data-mono text-primary underline mt-4 inline-block"
				>Kembali ke daftar mata pelajaran</a
			>
		</div>
	{:else if subject}
		<SubjectDetailHeader {subject} />

		<div class="flex flex-col">
			<div class="flex items-center gap-4 mb-4 neo-border-b pb-4">
				<h3 class="font-headline-md text-xl sm:text-headline-lg font-bold">Daftar Guru</h3>
				<span
					class="border-2 border-on-background bg-primary-fixed text-on-background px-3 py-1 font-bold font-data-mono neo-shadow-xs text-xs sm:text-sm"
				>
					{teachers.length} Guru Aktif
				</span>
			</div>

			<div
				class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full mb-6"
			>
				<div class="w-full sm:w-72">
					<SearchBar bind:value={searchQuery} placeholder="Cari NIP/Nama..." class="w-full" />
				</div>
				<div class="flex gap-3">
					<TooltipIconButton
						icon="history"
						tooltip="Riwayat Guru Mata Pelajaran"
						onclick={() => goto(`/subject/${id}/teacher-history`)}
					/>
					<TooltipIconButton
						icon={bulkSelectedTeacherIds.length === filteredTeachers.length &&
						filteredTeachers.length > 0
							? 'deselect'
							: 'checklist'}
						tooltip={bulkSelectedTeacherIds.length === filteredTeachers.length &&
						filteredTeachers.length > 0
							? 'Batal Pilih Semua Guru'
							: 'Pilih Semua Guru'}
						onclick={selectAllTeachers}
					/>
					{#if bulkSelectedTeacherIds.length > 0}
						<TooltipIconButton
							icon="groups"
							tooltip={`Aksi Massal (${bulkSelectedTeacherIds.length} guru terpilih)`}
							onclick={openBulkAction}
							badgeCount={bulkSelectedTeacherIds.length}
						/>
					{/if}
					<TooltipIconButton
						icon="person_add"
						tooltip="Tambah Guru"
						onclick={openAddTeacher}
					/>
				</div>
			</div>

			{#if filteredTeachers.length === 0}
				<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono text-on-surface-variant">
					{searchQuery
						? 'Tidak ada guru yang cocok dengan pencarian.'
						: 'Belum ada guru yang ditambahkan ke mata pelajaran ini.'}
				</div>
			{:else}
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter auto-rows-max"
				>
					{#each filteredTeachers as teacher, i (teacher.id)}
						<TeacherCard
							{teacher}
							index={i}
							selected={bulkSelectedTeacherIds.includes(teacher.id)}
							onToggle={() => toggleTeacherSelection(teacher.id)}
						/>
					{/each}
					<button
						onclick={openAddTeacher}
						class="neo-border border-dashed border-on-background opacity-70 flex flex-col items-center justify-center p-6 gap-2 hover:opacity-100 transition-opacity cursor-pointer h-full min-h-[200px]"
					>
						<Icon name="add_circle" size="40px" class="text-on-surface-variant" />
						<span class="font-label-caps text-label-caps uppercase text-on-surface-variant"
							>Tambah Guru</span
						>
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-center py-xl">
			<h2 class="font-headline-md text-headline-md text-error">Mata Pelajaran tidak ditemukan</h2>
			<a href="/subject" class="font-data-mono text-data-mono text-primary underline mt-4 inline-block"
				>Kembali ke daftar mata pelajaran</a
			>
		</div>
	{/if}
</div>

<Modal bind:isOpen={isAddTeacherOpen} title="Tambah Guru ke Mata Pelajaran">
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="teacher"
			label="Guru"
			bind:value={addTeacherIds}
			options={allTeachers
				.filter((t) => t.status === 'Aktif')
				.map((t) => ({ value: t.id, label: t.fullname }))}
			placeholder="Pilih Guru"
			multiple={true}
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isAddTeacherOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleAddTeacher}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isBulkActionOpen} title="Aksi Massal Guru">
	<div class="flex flex-col gap-6">
		<div>
			<span class="block font-label-caps text-label-caps font-bold mb-2 text-on-surface"
				>Guru Terpilih ({bulkSelectedTeacherIds.length}):</span
			>
			<div class="neo-border bg-surface-container p-4 max-h-48 overflow-y-auto">
				<ul class="list-disc list-inside font-data-mono text-sm">
					{#each bulkSelectedTeacherIds as tid}
						<li>{teachers.find((t) => t.id === tid)?.fullname || tid}</li>
					{/each}
				</ul>
			</div>
		</div>

		<SearchableSelect
			id="action-type"
			label="Jenis Aksi"
			bind:value={bulkActionType}
			options={[
				{ value: 'nonaktifkan', label: 'Nonaktifkan' },
				{ value: 'delete', label: 'Hapus' }
			]}
			searchThreshold={10}
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isBulkActionOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleBulkAction}>Proses</Button>
	{/snippet}
</Modal>
