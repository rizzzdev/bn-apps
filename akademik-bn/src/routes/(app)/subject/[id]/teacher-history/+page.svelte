<script lang="ts">
	import { Button, Badge } from '$lib/components/atoms';
	import { PageHeader, Pagination } from '$lib/components/molecules';
	import { subjectApi, teacherApi } from '$lib/services';
	import type { SubjectTeacher, ShadowSubject, ShadowTeacher } from '$lib/types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatTeacherName } from '$lib/utils/image';

	let id = $derived($page.params.id ?? '');
	let subject = $state<ShadowSubject | null>(null);
	let items = $state<any[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	let currentPage = $state(1);
	const itemsPerPage = 10;

	let paginatedItems = $derived(
		items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	onMount(async () => {
		if (!id) {
			error = 'ID tidak valid';
			isLoading = false;
			return;
		}
		try {
			const [subjRes, stRes, tchRes] = await Promise.all([
				subjectApi.getById(id),
				teacherApi.subjectTeachers.listBySubject(id),
				teacherApi.list(1, 1000)
			]);

			if (subjRes.data) subject = subjRes.data;
			const subjectTeachers = stRes.data || [];
			const teachers = tchRes.data || [];

			subjectTeachers.sort((a: SubjectTeacher, b: SubjectTeacher) => {
				if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
				if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});

			items = subjectTeachers.map((st: SubjectTeacher) => {
				const teacher = teachers.find((t: ShadowTeacher) => t.id === st.teacherId);
				return {
					id: st.id,
					teacherName: teacher ? formatTeacherName(teacher) : st.teacherId,
					nip: teacher?.nip ?? '-',
					status: st.status,
					createdAt: new Date(st.createdAt).toLocaleDateString('id-ID', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					})
				};
			});
		} catch {
			error = 'Gagal memuat riwayat guru mata pelajaran';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{subject ? `Riwayat Guru ${subject.name} - Akademik-BN` : 'Riwayat Guru Mata Pelajaran - Akademik-BN'}</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<PageHeader
		title="Riwayat Guru Mata Pelajaran"
		description={subject ? `GURU MAPEL // ${subject.name}` : 'GURU MAPEL'}
	/>

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 font-data-mono text-data-mono">
			{error}
		</div>
	{:else if items.length === 0}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono text-on-surface-variant">
			Belum ada riwayat guru untuk mata pelajaran ini.
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each paginatedItems as item}
				<div
					class="neo-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:-translate-y-0.5 hover:neo-shadow-xs {item.status ===
					'Aktif'
						? 'bg-primary-container/20 border-l-8 border-l-primary'
						: 'bg-surface'}"
				>
					<div class="flex flex-col gap-1.5">
						<div class="flex items-center gap-2">
							<span class="font-headline-sm text-base font-bold text-on-surface"
								>{item.teacherName}</span
							>
							<Badge variant={item.status === 'Aktif' ? 'success' : 'default'}>{item.status === 'TidakAktif' ? 'Tidak Aktif' : item.status}</Badge>
						</div>
						<div
							class="flex flex-wrap items-center gap-x-6 gap-y-1 font-data-mono text-sm text-on-surface-variant"
						>
							<span>NIP: <strong class="text-on-surface">{item.nip}</strong></span>
						</div>
					</div>
					<div class="font-data-mono text-sm text-on-surface-variant shrink-0 self-start sm:self-center">
						{item.createdAt}
					</div>
				</div>
			{/each}
		</div>

		<Pagination
			bind:currentPage
			totalPages={Math.ceil(items.length / itemsPerPage)}
			totalItems={items.length}
			{itemsPerPage}
		/>
	{/if}

	<div class="mt-4">
		<Button variant="ghost" onclick={() => goto(`/subject/${id}`)}>Kembali ke Detail Mata Pelajaran</Button>
	</div>
</div>
