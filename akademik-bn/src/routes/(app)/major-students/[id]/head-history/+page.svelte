<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import { DetailHeader, HistoryTable, Pagination } from '$lib/components/molecules';
	import type { HistoryItem } from '$lib/components/molecules';
	import { majorApi, majorHeadApi, teacherApi, academicYearApi } from '$lib/services';
	import type { MajorHead, ShadowMajor, ShadowTeacher, ShadowAcademicYear } from '$lib/types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatTeacherName } from '$lib/utils/image';

	let id = $derived($page.params.id ?? '');
	let major = $state<ShadowMajor | null>(null);
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
			const [majorRes, headRes, tchRes, ayRes] = await Promise.all([
				majorApi.getById(id),
				majorHeadApi.listByMajor(id),
				teacherApi.list(1, 1000),
				academicYearApi.list(1, 100)
			]);

			if (majorRes.data) major = majorRes.data;
			const heads = headRes.data || [];
			const teachers = tchRes.data || [];
			const ays = ayRes.data || [];

			heads.sort((a, b) => {
				if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
				if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});

			items = heads.map((mh: MajorHead) => {
				const teacher = teachers.find((t: ShadowTeacher) => t.id === mh.teacherId);
				const ay = ays.find((a: ShadowAcademicYear) => a.id === mh.academicYearId);
				return {
					id: mh.id,
					teacherName: teacher ? formatTeacherName(teacher) : mh.teacherId,
					teacherNip: teacher?.nip ?? undefined,
					academicYearCode: ay ? `${ay.code} (${ay.semesterType})` : mh.academicYearId,
					status: mh.status,
					createdAt: new Date(mh.createdAt).toLocaleDateString('id-ID', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					})
				};
			});
		} catch {
			error = 'Gagal memuat riwayat kepala jurusan';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title
		>{major
			? `Riwayat Kepala Jurusan ${major.name} - Akademik-BN`
			: 'Riwayat Kepala Jurusan - Akademik-BN'}</title
	>
</svelte:head>

<div class="flex flex-col gap-6">
	<DetailHeader
		title="Riwayat Kepala Jurusan"
		name={major?.name}
		code={major?.code}
		backHref={`/major-students/${id}`}
	/>

	<HistoryTable
		items={paginatedItems}
		{isLoading}
		{error}
		emptyMessage="Belum ada riwayat kepala jurusan untuk jurusan ini."
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
		<Button variant="ghost" onclick={() => goto(`/major-students/${id}`)}>
			Kembali ke Detail Jurusan
		</Button>
	</div>
</div>
