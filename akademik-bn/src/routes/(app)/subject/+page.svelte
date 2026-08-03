<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import {
		PageHeader,
		Modal,
		SearchBar,
		SearchableSelect,
		Pagination
	} from '$lib/components/molecules';
	import { SubjectTable } from '$lib/features/subject';
	import { subjectApi, teacherApi } from '$lib/services';
	import type { ShadowSubject, ShadowTeacher, Subject } from '$lib/types';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { formatTeacherName } from '$lib/utils/image';

	let subjects = $state<Subject[]>([]);
	let allSubjects = $state<ShadowSubject[]>([]);
	let allTeachers = $state<ShadowTeacher[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	let currentPage = $state(1);
	let searchTerm = $state('');
	let itemsPerPage = 10;

	let filteredSubjects = $derived.by(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return subjects;
		return subjects.filter(
			(s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
		);
	});
	let totalItems = $derived(filteredSubjects.length);
	let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
	let displayedSubjects = $derived(
		filteredSubjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	// Add Teacher mapping modal
	let isAddTeacherOpen = $state(false);
	let selectedSubjectId = $state('');
	let addTeacherIds = $state<string[]>([]);
	let addTargetHours = $state<number>(0);

	function openView(sub: Subject) {
		if (sub?.id) goto(`/subject/${sub.id}`);
	}

	function openHistory(sub: Subject) {
		if (sub?.id) goto(`/subject/${sub.id}/teacher-history`);
	}

	function openAddTeacher(sub?: Subject) {
		selectedSubjectId = sub?.id || '';
		addTeacherIds = [];
		addTargetHours = 0;
		isAddTeacherOpen = true;
	}

	async function loadSubjects() {
		isLoading = true;
		error = '';
		try {
			const [subjectRes, allSubjectRes, teacherRes, stRes] = await Promise.all([
				subjectApi.list(1, 1000),
				subjectApi.list(1, 1000),
				teacherApi.list(1, 1000),
				teacherApi.subjectTeachers.list(1, 1000)
			]);

			if (allSubjectRes.data) {
				allSubjects = allSubjectRes.data as ShadowSubject[];
			}

			if (teacherRes.data) {
				allTeachers = teacherRes.data as ShadowTeacher[];
			}

			if (subjectRes.data) {
				const subjectList = subjectRes.data as ShadowSubject[];

				const subjectTeachers = stRes.data || [];

				subjects = subjectList.map((s) => {
					const totalTeachers = subjectTeachers.filter(
						(st: any) => st.subjectId === s.id && st.status === 'Aktif' && !st.deletedAt
					).length;
					return {
						id: s.id,
						name: s.name,
						code: s.code,
						totalTeachers,
						teacherId: '',
						teacherName: '',
						field: ''
					};
				});
			}
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data mata pelajaran');
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		const _ = searchTerm;
		currentPage = 1;
	});

	onMount(() => {
		loadSubjects();
	});

	async function handleAddTeacher() {
		if (!selectedSubjectId || addTeacherIds.length === 0) {
			toast.error('Pilih mata pelajaran dan guru terlebih dahulu');
			return;
		}

		try {
			const payloads = addTeacherIds.map((teacherId) => ({
				teacherId,
				subjectId: selectedSubjectId,
				targetHours: addTargetHours,
				status: 'Aktif' as const
			}));

			for (const payload of payloads) {
				await teacherApi.subjectTeachers.create(payload);
			}
			toast.success('Pemetaan guru mata pelajaran berhasil ditambahkan');
			isAddTeacherOpen = false;
			addTeacherIds = [];
			await loadSubjects();
		} catch {
			toast.error('Gagal menambahkan pemetaan guru mata pelajaran');
		}
	}
</script>

<svelte:head>
	<title>Pemetaan Guru Mata Pelajaran - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		title="Pemetaan Guru Mata Pelajaran"
		description="MANAJEMEN PEMETAAN GURU DAFTAR MATA PELAJARAN"
	/>

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-xs">Memuat data...</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 text-center font-data-mono text-xs">
			{error}
		</div>
	{:else}
		<SearchBar bind:value={searchTerm} placeholder="Cari mata pelajaran (nama / kode)..." />

		<SubjectTable
			subjects={displayedSubjects}
			onView={openView}
			onAddTeacher={openAddTeacher}
			onHistoryTeacher={openHistory}
		/>

		<Pagination bind:currentPage {totalPages} {totalItems} {itemsPerPage} />
	{/if}
</div>

<Modal bind:isOpen={isAddTeacherOpen} title="Tambah Pemetaan Guru Mata Pelajaran">
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="subject-select"
			label="Mata Pelajaran"
			bind:value={selectedSubjectId}
			options={allSubjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
			placeholder="Pilih Mata Pelajaran"
		/>
		<SearchableSelect
			id="teacher-select"
			label="Guru"
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
