<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import { DetailHeader, HistoryTable, Pagination } from '$lib/components/molecules';
	import type { HistoryItem } from '$lib/components/molecules';
	import { classApi, teacherApi, academicYearApi } from '$lib/services';
	import type { HomeroomTeacher, ShadowClass, ShadowTeacher, ShadowAcademicYear } from '$lib/types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatTeacherName } from '$lib/utils/image';

	let id = $derived($page.params.id ?? '');
	let cls = $state<ShadowClass | null>(null);
	let items = $state<HistoryItem[]>([]);
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
			const [classRes, htRes, tchRes, ayRes] = await Promise.all([
				classApi.getById(id),
				teacherApi.homeroom.listByClass(id),
				teacherApi.list(1, 1000),
				academicYearApi.list(1, 100)
			]);

			if (classRes.data) cls = classRes.data;
			const homerooms = htRes.data || [];
			const teachers = tchRes.data || [];
			const ays = ayRes.data || [];

			homerooms.sort((a, b) => {
				if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
				if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});

			items = homerooms.map((ht: HomeroomTeacher) => {
				const teacher = teachers.find((t: ShadowTeacher) => t.id === ht.teacherId);
				const ay = ays.find((a: ShadowAcademicYear) => a.id === ht.academicYearId);
				return {
					id: ht.id,
					teacherName: teacher ? formatTeacherName(teacher) : ht.teacherId,
					teacherNip: teacher?.nip ?? undefined,
					academicYearCode: ay ? `${ay.code} (${ay.semesterType})` : ht.academicYearId,
					status: ht.status,
					createdAt: new Date(ht.createdAt).toLocaleDateString('id-ID', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					})
				};
			});
		} catch {
			error = 'Gagal memuat riwayat wali kelas';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title
		>{cls
			? `Riwayat Wali Kelas ${cls.name} - Akademik-BN`
			: 'Riwayat Wali Kelas - Akademik-BN'}</title
	>
</svelte:head>

<div class="flex flex-col gap-6">
	<DetailHeader title="Riwayat Wali Kelas" name={cls?.name} backHref={`/class-students/${id}`} />

	<HistoryTable
		items={paginatedItems}
		{isLoading}
		{error}
		emptyMessage="Belum ada riwayat wali kelas untuk kelas ini."
	/>

	{#if items.length > itemsPerPage}
		<Pagination
			bind:currentPage
			totalPages={Math.ceil(items.length / itemsPerPage)}
			totalItems={items.length}
			{itemsPerPage}
		/>
	{/if}

	<div class="mt-2">
		<Button variant="ghost" onclick={() => goto(`/class-students/${id}`)}>
			Kembali ke Detail Kelas
		</Button>
	</div>
</div>
