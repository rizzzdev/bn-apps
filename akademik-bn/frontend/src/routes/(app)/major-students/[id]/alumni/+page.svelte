<script lang="ts">
	import { Button, Badge } from '$lib/components/atoms';
	import { PageHeader, Pagination, SearchBar } from '$lib/components/molecules';
	import { majorApi, studentApi, academicYearApi } from '$lib/services';
	import type { ShadowMajor, ShadowStudent, ShadowAcademicYear } from '$lib/types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let id = $derived($page.params.id ?? '');
	let major = $state<ShadowMajor | null>(null);
	let allItems = $state<any[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let searchQuery = $state('');

	let currentPage = $state(1);
	const itemsPerPage = 10;

	let filteredItems = $derived(
		allItems.filter(
			(s) =>
				!searchQuery ||
				s.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.nis.includes(searchQuery)
		)
	);

	let paginatedItems = $derived(
		filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		filteredItems;
		currentPage = 1;
	});

	onMount(async () => {
		if (!id) {
			error = 'ID tidak valid';
			isLoading = false;
			return;
		}
		try {
			const [majorRes, msRes, studRes, ayRes] = await Promise.all([
				majorApi.getById(id),
				majorApi.majorStudents.list(1, 1000),
				studentApi.list(1, 1000),
				academicYearApi.list(1, 100)
			]);

			if (majorRes.data) major = majorRes.data;
			const majorStudents = msRes.data || [];
			const allStudents = studRes.data || [];
			const ays = ayRes.data || [];

			const nonActive = majorStudents.filter(
				(ms) => ms.majorId === id && !ms.deletedAt && ms.status !== 'Aktif'
			);

			nonActive.sort(
				(a, b) =>
					new Date(b.updatedAt || b.createdAt).getTime() -
					new Date(a.updatedAt || a.createdAt).getTime()
			);

			const studentMap = new Map<string, (typeof nonActive)[0]>();
			for (const record of nonActive) {
				if (!studentMap.has(record.studentId)) {
					studentMap.set(record.studentId, record);
				}
			}

			const list = Array.from(studentMap.values()).map((ms) => {
				const student = allStudents.find((s) => s.id === ms.studentId);
				const ay = ays.find((a) => a.id === ms.academicYearId);
				return {
					id: ms.id,
					studentId: ms.studentId,
					fullname: student?.fullname ?? ms.studentId,
					nis: student?.nis ?? '-',
					nisn: student?.nisn ?? '-',
					academicYearCode: ay ? `${ay.code} (${ay.semesterType})` : ms.academicYearId,
					status: ms.status,
					updatedAt: new Date(ms.updatedAt || ms.createdAt).toLocaleDateString('id-ID', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					}),
					rawDate: new Date(ms.updatedAt || ms.createdAt).getTime()
				};
			});

			list.sort((a, b) => {
				if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
				if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
				return b.rawDate - a.rawDate;
			});

			allItems = list;
		} catch {
			error = 'Gagal memuat riwayat alumni';
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="flex flex-col gap-8">
	<PageHeader
		title="Riwayat Alumni & Murid Non-Aktif"
		description={major ? `ALUMNI // ${major.name}` : 'ALUMNI'}
	/>

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 font-data-mono text-data-mono">
			{error}
		</div>
	{:else if filteredItems.length === 0}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono text-on-surface-variant">
			{searchQuery
				? 'Tidak ada murid yang cocok dengan pencarian.'
				: 'Belum ada riwayat alumni/murid non-aktif.'}
		</div>
	{:else}
		<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-2">
			<div class="w-full sm:w-80">
				<SearchBar bind:value={searchQuery} placeholder="Cari NIS / Nama Murid..." class="w-full" />
			</div>
			<span class="font-data-mono text-data-mono text-on-surface-variant">
				Menampilkan {allItems.length} alumni
			</span>
		</div>

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
								>{item.fullname}</span
							>
							<Badge
								variant={item.status === 'Aktif'
									? 'success'
									: item.status === 'Lulus'
										? 'success'
										: item.status === 'Pindah'
											? 'warning'
											: 'default'}
							>
								{item.status}
							</Badge>
						</div>
						<div
							class="flex flex-wrap items-center gap-x-6 gap-y-1 font-data-mono text-sm text-on-surface-variant"
						>
							<span
								>NIS/NISN: <strong class="text-on-surface"
									>{item.nis}{item.nisn !== '-' ? ` / ${item.nisn}` : ''}</strong
								></span
							>
							<span>Tahun Ajaran: <strong class="text-on-surface">{item.academicYearCode}</strong></span>
						</div>
					</div>
					<div class="font-data-mono text-sm text-on-surface-variant shrink-0 self-start sm:self-center">
						{item.updatedAt}
					</div>
				</div>
			{/each}
		</div>

		<Pagination
			bind:currentPage
			totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
			totalItems={filteredItems.length}
			{itemsPerPage}
		/>
	{/if}

	<div class="mt-4">
		<Button variant="ghost" onclick={() => goto(`/major-students/${id}`)}>Kembali ke Detail Jurusan</Button>
	</div>
</div>
