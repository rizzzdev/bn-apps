<script lang="ts">
	import { Button, Badge } from '$lib/components/atoms';
	import { PageHeader, Pagination, SearchBar } from '$lib/components/molecules';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface RawMapping {
		id: string;
		studentId: string;
		academicYearId: string;
		status: string;
		createdAt?: string;
		updatedAt?: string;
		deletedAt?: string | null;
		classId?: string;
		majorId?: string;
	}

	interface DetailEntity {
		id?: string;
		name?: string;
	}

	interface StudentLite {
		id: string;
		fullname?: string;
		nis?: string | null;
		nisn?: string | null;
	}

	interface AcademicYearLite {
		id: string;
		code?: string;
		semesterType?: string;
	}

	interface AlumniItem {
		id: string;
		studentId: string;
		fullname: string;
		nis: string;
		nisn: string;
		academicYearCode: string;
		status: string;
		updatedAt: string;
		rawDate: number;
	}

	let {
		entityId,
		titlePrefix = 'Entitas',
		backHref,
		backLabel,
		warningStatuses = ['Pindah'],
		mappingKey = 'classId',
		fetchDetail = async () => null,
		fetchMappings = async () => [],
		fetchStudents = async () => [],
		fetchAcademicYears = async () => []
	} = $props<{
		entityId: string;
		/** Prefix judul halaman, mis. 'Kelas' → "Riwayat Alumni Kelas - Akademik-BN". */
		titlePrefix?: string;
		backHref: string;
		backLabel: string;
		/** Status yang ditampilkan sebagai badge warning (mis. ['Pindah', 'Naik Kelas']). */
		warningStatuses?: string[];
		/** Kunci filter mapping pada detail: 'classId' atau 'majorId'. */
		mappingKey?: 'classId' | 'majorId';
		fetchDetail: () => Promise<DetailEntity | null>;
		fetchMappings: () => Promise<RawMapping[]>;
		fetchStudents: () => Promise<StudentLite[]>;
		fetchAcademicYears: () => Promise<AcademicYearLite[]>;
	}>();

	let entity = $state<DetailEntity | null>(null);
	let allItems = $state<AlumniItem[]>([]);
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
		void filteredItems;
		currentPage = 1;
	});

	onMount(async () => {
		if (!entityId) {
			error = 'ID tidak valid';
			isLoading = false;
			return;
		}
		try {
			const [detail, mappings, students, ays] = await Promise.all([
				fetchDetail(),
				fetchMappings(),
				fetchStudents(),
				fetchAcademicYears()
			]);

			if (detail) entity = detail;

			const key = mappingKey as 'classId' | 'majorId';
			const nonActive = mappings.filter(
				(m: RawMapping) => m[key] === entityId && !m.deletedAt && m.status !== 'Aktif'
			);

			nonActive.sort(
				(a: RawMapping, b: RawMapping) =>
					new Date(b.updatedAt || b.createdAt || '').getTime() -
					new Date(a.updatedAt || a.createdAt || '').getTime()
			);

			const uniqueByStudent = new Map<string, RawMapping>();
			for (const record of nonActive) {
				if (!uniqueByStudent.has(record.studentId)) {
					uniqueByStudent.set(record.studentId, record);
				}
			}

			const list: AlumniItem[] = Array.from(uniqueByStudent.values()).map((m) => {
				const student = students.find((s: StudentLite) => s.id === m.studentId);
				const ay = ays.find((a: AcademicYearLite) => a.id === m.academicYearId);
				return {
					id: m.id,
					studentId: m.studentId,
					fullname: student?.fullname ?? m.studentId,
					nis: student?.nis ?? '-',
					nisn: student?.nisn ?? '-',
					academicYearCode: ay ? `${ay.code} (${ay.semesterType})` : m.academicYearId,
					status: m.status,
					updatedAt: new Date(m.updatedAt || m.createdAt || '').toLocaleDateString('id-ID', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					}),
					rawDate: new Date(m.updatedAt || m.createdAt || '').getTime()
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

<svelte:head>
	<title>
		{entity
			? `Riwayat Alumni ${entity.name} - Akademik-BN`
			: `Riwayat Alumni ${titlePrefix} - Akademik-BN`}
	</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<PageHeader
		title="Riwayat Alumni & Murid Non-Aktif"
		description={entity ? `ALUMNI // ${entity.name}` : 'ALUMNI'}
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
		<div
			class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono text-on-surface-variant"
		>
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
								variant={item.status === 'Aktif' || item.status === 'Lulus'
									? 'success'
									: warningStatuses.includes(item.status)
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
							<span
								>Tahun Ajaran: <strong class="text-on-surface">{item.academicYearCode}</strong
								></span
							>
						</div>
					</div>
					<div
						class="font-data-mono text-sm text-on-surface-variant shrink-0 self-start sm:self-center"
					>
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
		<Button variant="ghost" onclick={() => goto(backHref)}>{backLabel}</Button>
	</div>
</div>
