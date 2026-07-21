<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import { PageHeader, Modal, SearchableSelect, TooltipIconButton } from '$lib/components/molecules';
	import { scheduleApi, teacherApi } from '$lib/services';
	import type {
		TeacherPicketSchedule,
		ShadowTeacher
	} from '$lib/types';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatTeacherName } from '$lib/utils/image';

	let allTeachers = $state<ShadowTeacher[]>([]);
	let schedules = $state<TeacherPicketSchedule[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	// Selection (per teacher)
	let selectedTeacherIds = $state<string[]>([]);

	// Assign modal
	let isAssignOpen = $state(false);
	let assignDay = $state('Senin');
	let assignTeacherIds = $state<string[]>([]);

	// Bulk delete confirmation
	let isBulkDeleteOpen = $state(false);

	const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

	// ── Derived ──

	let todayIndex = $derived.by(() => {
		const now = new Date();
		const wibMs = now.getTime() + 7 * 60 * 60 * 1000; // UTC → WIB (+7 jam)
		const day = new Date(wibMs).getUTCDay(); // 0=Sun..6=Sat dalam WIB
		return day - 1; // 0=Senin..4=Jumat, -1=other
	});

	let activeTeachers = $derived(
		allTeachers.filter((t) => t.status === 'Aktif')
	);

	// Map day → schedules (non-deleted)
	let schedulesByDay = $derived.by<Map<string, TeacherPicketSchedule[]>>(() => {
		const map = new Map<string, TeacherPicketSchedule[]>();
		days.forEach((d) => map.set(d, []));
		for (const s of schedules) {
			if (s.deletedAt !== null) continue;
			const list = map.get(s.day);
			if (list) list.push(s);
		}
		return map;
	});

	// Set of teacher IDs that have any schedule
	let assignedTeacherIds = $derived.by<Set<string>>(() => {
		const set = new Set<string>();
		for (const s of schedules) {
			if (s.deletedAt !== null) continue;
			set.add(s.teacherId);
		}
		return set;
	});

	// Unassigned teachers (active but no schedule)
	let unassignedTeachers = $derived(
		activeTeachers.filter((t) => !assignedTeacherIds.has(t.id))
	);

	// Day totals
	let dayTotals = $derived.by<Record<string, number>>(() => {
		const totals: Record<string, number> = {};
		days.forEach((d) => (totals[d] = 0));
		for (const s of schedules) {
			if (s.deletedAt !== null) continue;
			totals[s.day] = (totals[s.day] || 0) + 1;
		}
		return totals;
	});

	let assignedTeachers = $derived(
		activeTeachers.filter((t) => assignedTeacherIds.has(t.id))
	);

	let totalSelected = $derived(selectedTeacherIds.length);
	let allSelected = $derived(
		assignedTeachers.length > 0 && totalSelected === assignedTeachers.length
	);

	// Lookup teacher name
	function getTeacherName(teacherId: string): string {
		const t = allTeachers.find((t) => t.id === teacherId);
		return t ? formatTeacherName(t) : teacherId;
	}

	// ── Selection ──

	function toggleSelect(teacherId: string) {
		if (selectedTeacherIds.includes(teacherId)) {
			selectedTeacherIds = selectedTeacherIds.filter((id) => id !== teacherId);
		} else {
			selectedTeacherIds = [...selectedTeacherIds, teacherId];
		}
	}

	function selectAll() {
		if (allSelected) {
			selectedTeacherIds = [];
		} else {
			selectedTeacherIds = assignedTeachers.map((t) => t.id);
		}
	}

	// ── Load Data ──

	async function loadSchedule() {
		isLoading = true;
		error = '';
		try {
			const [scheduleRes, teacherRes] = await Promise.all([
				scheduleApi.list(1, 200),
				teacherApi.list(1, 200)
			]);

			if (teacherRes.data) {
				allTeachers = teacherRes.data as ShadowTeacher[];
			}
			if (scheduleRes.data) {
				schedules = scheduleRes.data as TeacherPicketSchedule[];
			}
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat jadwal piket');
		} finally {
			isLoading = false;
		}
	}

	// ── Assign ──

	function openAssign() {
		assignDay = 'Senin';
		assignTeacherIds = [];
		isAssignOpen = true;
	}

	async function handleAssign() {
		if (assignTeacherIds.length === 0) {
			toast.error('Pilih minimal 1 guru');
			return;
		}
		try {
			const payloads = assignTeacherIds.map((teacherId) => ({
				teacherId,
				day: assignDay,
				status: 'Aktif' as const
			}));
			await scheduleApi.bulkCreate(payloads);
			toast.success(`${assignTeacherIds.length} guru berhasil ditugaskan ke ${assignDay}`);
			isAssignOpen = false;
			assignTeacherIds = [];
			await loadSchedule();
		} catch {
			toast.error('Gagal menugaskan guru');
		}
	}

	// ── Bulk Delete ──

	function openBulkDelete() {
		if (selectedTeacherIds.length === 0) {
			toast.error('Pilih guru terlebih dahulu');
			return;
		}
		isBulkDeleteOpen = true;
	}

	async function handleBulkDelete() {
		if (selectedTeacherIds.length === 0) return;
		try {
			const scheduleIds: string[] = [];
			for (const tid of selectedTeacherIds) {
				const dayScheds = schedules
					.filter((s) => s.teacherId === tid && s.deletedAt === null)
					.map((s) => s.id);
				scheduleIds.push(...dayScheds);
			}
			if (scheduleIds.length === 0) {
				toast.error('Tidak ada data yang bisa dihapus');
				return;
			}
			await scheduleApi.bulkDelete(scheduleIds);
			toast.success(`${scheduleIds.length} jadwal piket berhasil dihapus`);
			isBulkDeleteOpen = false;
			selectedTeacherIds = [];
			await loadSchedule();
		} catch {
			toast.error('Gagal menghapus jadwal piket');
		}
	}

	onMount(() => {
		loadSchedule();
	});
</script>

<div class="flex flex-col gap-6">
	<PageHeader title="Jadwal Piket Guru" description="MANAJEMEN JADWAL PIKET GURU" />

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 font-data-mono text-data-mono">
			{error}
		</div>
	{:else}
		<!-- Toolbar -->
		<div class="flex flex-row items-center justify-end gap-2">
			<TooltipIconButton
				icon={allSelected ? 'deselect' : 'checklist'}
				tooltip={allSelected ? 'Batal Pilih Semua' : 'Pilih Semua Guru'}
				onclick={selectAll}
			/>
			{#if totalSelected > 0}
				<TooltipIconButton
					icon="delete"
					tooltip={`Hapus Jadwal (${totalSelected} guru)`}
					onclick={openBulkDelete}
					badgeCount={totalSelected}
					variant="danger"
				/>
			{/if}
			<TooltipIconButton
				icon="add"
				tooltip="Atur Piket Guru"
				onclick={openAssign}
				variant="primary"
			/>
		</div>

		{#if activeTeachers.length === 0}
			<div class="neo-border bg-surface p-10 text-center font-data-mono text-data-mono text-on-surface-variant">
				<Icon name="calendar_today" size="32px" class="mb-3 opacity-40 mx-auto" />
				<p>Tidak ada guru aktif</p>
			</div>
		{:else}
			<!-- Daily Column Cards -->
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
				{#each days as day, i}
					{@const daySchedules = schedulesByDay.get(day) ?? []}
					{@const count = daySchedules.length}
					<div
						class="neo-border flex flex-col {i === todayIndex
							? 'bg-secondary-fixed border-secondary'
							: 'bg-surface'} overflow-hidden"
					>
						<!-- Day Header -->
						<div class="neo-border-b p-4 pb-3 {i === todayIndex ? 'bg-secondary-fixed-dim' : 'bg-surface-container'}">
							<div class="mb-1">
								<h3 class="font-headline-sm text-headline-sm uppercase">{day}</h3>
							</div>
							<p class="font-data-mono text-data-mono text-on-surface-variant">
								{count} Guru
							</p>
						</div>

						<!-- Teacher List -->
						<div class="flex-1 p-3 flex flex-col gap-2 min-h-[120px]">
							{#each daySchedules as sched}
								{@const teacherName = getTeacherName(sched.teacherId)}
								<div
									class="flex items-center gap-2 px-3 py-2 border-2 border-on-background bg-surface hover:shadow-[2px_2px_0px_0px_#1C1B1B] transition-all {selectedTeacherIds.includes(
										sched.teacherId
									)
										? 'bg-primary-container border-primary'
										: ''}"
								>
									<!-- Checkbox -->
									<button
										class="w-5 h-5 neo-border-sm flex items-center justify-center shrink-0 cursor-pointer {selectedTeacherIds.includes(
											sched.teacherId
										)
											? 'bg-primary text-on-primary'
											: 'bg-white hover:bg-surface-container-higher'}"
										onclick={() => toggleSelect(sched.teacherId)}
									>
										{#if selectedTeacherIds.includes(sched.teacherId)}
											<Icon name="check" size="12px" />
										{/if}
									</button>
									<!-- Name -->
									<span class="font-body-md text-body-md font-bold flex-1 truncate">{teacherName}</span>
								</div>
							{/each}
							{#if count === 0}
								<div class="flex-1 flex flex-col items-center justify-center text-center font-data-mono text-data-mono text-on-surface-variant py-4">
									<Icon name="calendar_today" size="18px" class="mb-1 opacity-40" />
									<p>Belum ada piket</p>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Unassigned Pool -->
			{#if unassignedTeachers.length > 0}
				<div class="neo-border bg-surface p-5">
					<div class="neo-border-b pb-3 mb-4 flex items-center gap-2">
						<Icon name="person" size="18px" class="text-on-surface-variant" />
						<h3 class="font-label-caps text-label-caps uppercase">Guru Belum Bertugas</h3>
						<span class="font-data-mono text-data-mono text-on-surface-variant">({unassignedTeachers.length})</span>
					</div>
					<div class="flex flex-wrap gap-3">
						{#each unassignedTeachers as teacher}
							<div class="neo-border-sm bg-surface-container px-3 py-2">
								<span class="font-body-md text-body-md font-bold">{formatTeacherName(teacher)}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<!-- Assign Modal -->
<Modal bind:isOpen={isAssignOpen} title="Atur Piket Guru">
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="assign-day"
			label="Hari"
			bind:value={assignDay}
			options={days.map((d) => ({ value: d, label: d }))}
			placeholder="Pilih Hari"
		/>
		{#if unassignedTeachers.length === 0}
			<div class="neo-border bg-surface-container p-4 text-center font-data-mono text-data-mono text-on-surface-variant">
				<p>Semua guru sudah memiliki jadwal piket.</p>
			</div>
		{:else}
			<SearchableSelect
				id="assign-teachers"
				label="Guru"
				bind:value={assignTeacherIds}
				options={unassignedTeachers.map((t) => ({
					value: t.id,
					label: formatTeacherName(t)
				}))}
				placeholder="Pilih Guru"
				multiple={true}
			/>
		{/if}
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isAssignOpen = false)}>Batal</Button>
		<Button
			variant="primary"
			onclick={handleAssign}
			disabled={unassignedTeachers.length === 0}
		>Simpan</Button>
	{/snippet}
</Modal>

<!-- Bulk Delete Confirmation -->
<Modal bind:isOpen={isBulkDeleteOpen} title="Konfirmasi Hapus Massal">
	<div>
		<span class="block font-label-caps text-label-caps font-bold mb-2 text-on-surface"
			>Guru Terpilih ({totalSelected}):</span
		>
		<div class="neo-border bg-surface-container p-4 max-h-48 overflow-y-auto">
			<ul class="list-disc list-inside font-data-mono text-sm">
				{#each selectedTeacherIds as tid}
					<li>{getTeacherName(tid)}</li>
				{/each}
			</ul>
		</div>
	</div>
	<p class="font-body-md text-body-md mt-4">
		Yakin ingin menghapus <strong>semua jadwal piket</strong> dari guru-guru ini?
	</p>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isBulkDeleteOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleBulkDelete}>Hapus Semua</Button>
	{/snippet}
</Modal>
