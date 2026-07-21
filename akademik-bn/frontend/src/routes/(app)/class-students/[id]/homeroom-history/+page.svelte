<script lang="ts">
	import { Button, Badge } from '$lib/components/atoms';
	import { PageHeader, Pagination } from '$lib/components/molecules';
	import { classApi, teacherApi, academicYearApi } from '$lib/services';
	import type { HomeroomTeacher, ShadowClass, ShadowTeacher, ShadowAcademicYear } from '$lib/types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatTeacherName } from '$lib/utils/image';

	let id = $derived($page.params.id ?? '');
	let cls = $state<ShadowClass | null>(null);
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
					nip: teacher?.nip ?? '-',
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

<div class="flex flex-col gap-8">
	<PageHeader
		title="Riwayat Wali Kelas"
		description={cls ? `WALI KELAS // ${cls.name}` : 'WALI KELAS'}
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
			Belum ada riwayat wali kelas untuk kelas ini.
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
							<Badge variant={item.status === 'Aktif' ? 'success' : 'default'}>{item.status}</Badge>
						</div>
						<div
							class="flex flex-wrap items-center gap-x-6 gap-y-1 font-data-mono text-sm text-on-surface-variant"
						>
							<span>NIP: <strong class="text-on-surface">{item.nip}</strong></span>
							<span>Tahun Ajaran: <strong class="text-on-surface">{item.academicYearCode}</strong></span>
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
		<Button variant="ghost" onclick={() => goto(`/class-students/${id}`)}>Kembali ke Detail Kelas</Button>
	</div>
</div>
