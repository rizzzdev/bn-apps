<script lang="ts">
	import { Button, Icon } from '$lib/components/atoms';
	import {
		DetailHeader,
		SearchBar,
		Modal,
		SearchableSelect,
		TooltipIconButton
	} from '$lib/components/molecules';
	import { TeacherCard } from '$lib/features/subject';
	import { subjectApi, teacherApi } from '$lib/services';
	import type { ShadowSubject, SubjectTeacher, ShadowTeacher } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatTeacherName } from '$lib/utils/image';

	interface TeacherItem {
		id: string;
		fullname: string;
		nip: string;
		pictureUrl?: string | null;
		subjectTeacherId: string;
		targetHours?: number;
	}

	let id = $derived($page.params.id ?? '');
	let subject = $state<{
		id: string;
		name: string;
		code: string;
		totalTeachers: number;
	} | null>(null);
	let teachers = $state<TeacherItem[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	let allTeachers = $state<ShadowTeacher[]>([]);
	let subjectTeacherMap = $state<Record<string, string>>({});

	let searchQuery = $state('');

	let isAddTeacherOpen = $state(false);
	let addTeacherIds = $state<string[]>([]);
	let addTargetHours = $state<number>(0);

	let isEditTargetModalOpen = $state(false);
	let editingTeacher = $state<TeacherItem | null>(null);
	let editTargetHours = $state<number>(0);

	let bulkSelectedTeacherIds = $state<string[]>([]);

	let isBulkActionOpen = $state(false);
	let bulkActionType = $state<'nonaktifkan' | 'delete' | 'targetHours'>('nonaktifkan');
	let bulkTargetHours = $state<number>(0);

	let filteredTeachers = $derived(
		teachers.filter(
			(t) =>
				t.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(t.nip && t.nip.includes(searchQuery))
		)
	);

	function selectAllTeachers() {
		if (bulkSelectedTeacherIds.length === filteredTeachers.length && filteredTeachers.length > 0) {
			bulkSelectedTeacherIds = [];
		} else {
			bulkSelectedTeacherIds = filteredTeachers.map((t) => t.id);
		}
	}

	function toggleTeacherSelection(teacherId: string) {
		if (bulkSelectedTeacherIds.includes(teacherId)) {
			bulkSelectedTeacherIds = bulkSelectedTeacherIds.filter((s) => s !== teacherId);
		} else {
			bulkSelectedTeacherIds = [...bulkSelectedTeacherIds, teacherId];
		}
	}

	function openAddTeacher() {
		addTeacherIds = [];
		addTargetHours = 0;
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
					status: 'Aktif',
					targetHours: addTargetHours
				});
			}
			toast.success(`${addTeacherIds.length} guru berhasil ditambahkan`);
			isAddTeacherOpen = false;
			addTeacherIds = [];
			await fetchTeachers();
		} catch {
			toast.error('Gagal menambahkan guru');
		}
	}

	function openEditTargetHours(teacher: TeacherItem) {
		editingTeacher = teacher;
		editTargetHours = teacher.targetHours || 0;
		isEditTargetModalOpen = true;
	}

	async function handleSaveEditTargetHours() {
		if (!editingTeacher || !editingTeacher.subjectTeacherId) return;
		try {
			await teacherApi.subjectTeachers.update(editingTeacher.subjectTeacherId, {
				targetHours: editTargetHours
			});
			toast.success(`Target beban jam ${editingTeacher.fullname} berhasil diperbarui!`);
			isEditTargetModalOpen = false;
			editingTeacher = null;
			await fetchTeachers();
		} catch {
			toast.error('Gagal memperbarui target beban jam');
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
			const stIds = bulkSelectedTeacherIds.map((tId) => subjectTeacherMap[tId]).filter(Boolean);
			if (stIds.length === 0) {
				toast.error('Tidak ada data yang bisa diproses');
				return;
			}

			let res;
			if (bulkActionType === 'nonaktifkan') {
				res = await teacherApi.subjectTeachers.bulkStatus(stIds, 'TidakAktif');
				toast.success(`${res?.data?.updated ?? stIds.length} guru berhasil dinonaktifkan`);
			} else if (bulkActionType === 'targetHours') {
				res = await teacherApi.subjectTeachers.bulkTargetHours(stIds, bulkTargetHours);
				toast.success(
					`Target beban JP ${res?.data?.updated ?? stIds.length} guru berhasil diperbarui!`
				);
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
					fullname: teacher ? formatTeacherName(teacher) : st.teacherId,
					nip: teacher?.nip ?? '-',
					pictureUrl: teacher?.pictureUrl ?? null,
					subjectTeacherId: st.id,
					targetHours: st.targetHours || 0
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
		} catch {
			error = 'Gagal memuat data mata pelajaran';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{subject ? `${subject.name} - Akademik-BN` : 'Detail Mata Pelajaran - Akademik-BN'}</title>
</svelte:head>

<div class="flex flex-col gap-6">
	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-xs">Memuat data...</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 text-center font-data-mono text-xs">
			<h2 class="font-headline-md text-lg text-error">Terjadi Kesalahan</h2>
			<p class="font-data-mono text-xs text-on-surface-variant mt-2">{error}</p>
			<a href="/subject" class="font-data-mono text-xs text-primary underline mt-4 inline-block">
				Kembali ke daftar mata pelajaran
			</a>
		</div>
	{:else if subject}
		<DetailHeader
			title="Detail Mata Pelajaran"
			name={subject.name}
			code={subject.code}
			backHref="/subject"
		/>

		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-3 border-b-2 pb-2">
				<h3 class="font-headline-md text-lg font-bold">Daftar Guru</h3>
				<span
					class="border-2 border-on-background bg-primary-fixed text-on-background px-2 py-0.5 font-bold font-data-mono neo-shadow-xs text-xs"
				>
					{teachers.length} Guru Aktif
				</span>
			</div>

			<div
				class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full mb-2"
			>
				<div class="w-full sm:w-64">
					<SearchBar bind:value={searchQuery} placeholder="Cari NIP/Nama..." class="w-full" />
				</div>
				<div class="flex items-center gap-2">
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
					<TooltipIconButton icon="person_add" tooltip="Tambah Guru" onclick={openAddTeacher} />
				</div>
			</div>

			{#if filteredTeachers.length === 0}
				<div
					class="neo-border bg-surface p-8 text-center font-data-mono text-xs text-on-surface-variant"
				>
					{searchQuery
						? 'Tidak ada guru yang cocok dengan pencarian.'
						: 'Belum ada guru yang ditambahkan ke mata pelajaran ini.'}
				</div>
			{:else}
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max"
				>
					{#each filteredTeachers as teacher, i (teacher.id)}
						<TeacherCard
							{teacher}
							index={i}
							selected={bulkSelectedTeacherIds.includes(teacher.id)}
							onToggle={() => toggleTeacherSelection(teacher.id)}
							onEditTargetHours={() => openEditTargetHours(teacher)}
						/>
					{/each}
					<button
						onclick={openAddTeacher}
						class="neo-border border-dashed border-on-background opacity-70 flex flex-col items-center justify-center p-4 gap-2 hover:opacity-100 transition-opacity cursor-pointer min-h-[100px]"
					>
						<Icon name="add_circle" size="28px" class="text-on-surface-variant" />
						<span class="font-label-caps text-xs uppercase text-on-surface-variant font-bold">
							Tambah Guru
						</span>
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<Modal bind:isOpen={isAddTeacherOpen} title="Tambah Guru ke Mata Pelajaran">
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="teacher"
			label="Pilih Guru"
			bind:value={addTeacherIds}
			options={allTeachers
				.filter((t) => t.status === 'Aktif')
				.map((t) => ({ value: t.id, label: formatTeacherName(t) }))}
			placeholder="Pilih Guru"
			multiple={true}
		/>

		<div>
			<label
				for="addTargetHours"
				class="block text-xs font-label-caps uppercase font-bold text-on-surface mb-1"
			>
				Target Beban Jam Pelajaran (JP/minggu):
			</label>
			<input
				id="addTargetHours"
				type="number"
				min="0"
				max="40"
				bind:value={addTargetHours}
				class="w-full h-8 px-3 neo-border bg-surface text-on-surface font-data-mono text-xs font-bold"
			/>
		</div>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isAddTeacherOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleAddTeacher}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditTargetModalOpen} title="Ubah Target Beban JP Guru">
	<div class="flex flex-col gap-4">
		{#if editingTeacher}
			<p class="text-xs font-bold text-on-surface font-data-mono">
				{editingTeacher.fullname}
			</p>
			<div>
				<label
					for="editTargetHours"
					class="block text-xs font-label-caps uppercase font-bold text-on-surface mb-1"
				>
					Target Beban Jam Pelajaran (JP/minggu):
				</label>
				<input
					id="editTargetHours"
					type="number"
					min="0"
					max="40"
					bind:value={editTargetHours}
					class="w-full h-8 px-3 neo-border bg-surface text-on-surface font-data-mono text-xs font-bold"
				/>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isEditTargetModalOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleSaveEditTargetHours}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isBulkActionOpen} title="Aksi Massal Guru">
	<div class="flex flex-col gap-4">
		<div>
			<span class="block font-label-caps text-xs font-bold mb-2 text-on-surface">
				Guru Terpilih ({bulkSelectedTeacherIds.length}):
			</span>
			<div class="neo-border bg-surface-container p-3 max-h-40 overflow-y-auto">
				<ul class="list-disc list-inside font-data-mono text-xs">
					{#each bulkSelectedTeacherIds as tid}
						<li>{teachers.find((t) => t.id === tid)?.fullname || tid}</li>
					{/each}
				</ul>
			</div>
		</div>

		<SearchableSelect
			id="action-type"
			label="Jenis Aksi Massal"
			bind:value={bulkActionType}
			options={[
				{ value: 'nonaktifkan', label: 'Nonaktifkan Guru' },
				{ value: 'targetHours', label: 'Ubah Target Beban JP/minggu' },
				{ value: 'delete', label: 'Hapus Pemetaan Guru' }
			]}
			searchThreshold={10}
		/>

		{#if bulkActionType === 'targetHours'}
			<div>
				<label
					for="bulkTargetHoursInput"
					class="block text-xs font-label-caps uppercase font-bold text-on-surface mb-1"
				>
					Target Beban Jam Pelajaran Baru (JP/minggu):
				</label>
				<input
					id="bulkTargetHoursInput"
					type="number"
					min="0"
					max="40"
					bind:value={bulkTargetHours}
					class="w-full h-8 px-3 neo-border bg-surface text-on-surface font-data-mono text-xs font-bold"
				/>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isBulkActionOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleBulkAction}>Proses</Button>
	{/snippet}
</Modal>
