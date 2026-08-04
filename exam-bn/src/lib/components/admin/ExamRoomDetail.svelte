<script lang="ts">
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/stores/toast';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

	let { data, form }: { data: any; form: any } = $props();

	let submitting = $state(false);
	let selectedParticipants = $state<string[]>([]);
	let selectedMonitors = $state<string[]>([]);
	let participantSearch = $state('');
	let monitorSearch = $state('');

	let participantToRemove = $state<string | null>(null);
	let monitorToRemove = $state<string | null>(null);
	let removeParticipantForm: HTMLFormElement;
	let removeMonitorForm: HTMLFormElement;

	let filteredParticipants = $derived(
		data.availableParticipants.filter(
			(u: any) =>
				u.fullname.toLowerCase().includes(participantSearch.toLowerCase()) ||
				u.email.toLowerCase().includes(participantSearch.toLowerCase())
		)
	);

	// Remaining seats in this room for this exam's time slot (null = no capacity limit).
	let remainingCapacity = $derived<number | null>(data.roomAvailability?.remaining ?? null);
	let capacityReached = $derived(
		remainingCapacity !== null && selectedParticipants.length >= remainingCapacity
	);

	let filteredMonitors = $derived(
		data.availableSupervisors.filter(
			(u: any) =>
				u.fullname.toLowerCase().includes(monitorSearch.toLowerCase()) ||
				u.email.toLowerCase().includes(monitorSearch.toLowerCase())
		)
	);

	function toggleParticipant(id: string) {
		if (selectedParticipants.includes(id)) {
			selectedParticipants = selectedParticipants.filter((i) => i !== id);
		} else {
			if (capacityReached) return; // room full — can't select more
			selectedParticipants = [...selectedParticipants, id];
		}
	}

	function toggleMonitor(id: string) {
		if (selectedMonitors.includes(id)) {
			selectedMonitors = selectedMonitors.filter((i) => i !== id);
		} else {
			selectedMonitors = [...selectedMonitors, id];
		}
	}

	function toggleAllParticipants() {
		const filteredIds = filteredParticipants.map((u: any) => u.id);
		const allSelected = filteredIds.every((id: string) => selectedParticipants.includes(id));
		if (allSelected) {
			selectedParticipants = selectedParticipants.filter((id) => !filteredIds.includes(id));
		} else {
			const merged = [...new Set([...selectedParticipants, ...filteredIds])];
			// Cap at remaining capacity so "select all" can't overbook the room.
			selectedParticipants =
				remainingCapacity !== null ? merged.slice(0, remainingCapacity) : merged;
		}
	}

	function toggleAllMonitors() {
		const filteredIds = filteredMonitors.map((u: any) => u.id);
		const allSelected = filteredIds.every((id: string) => selectedMonitors.includes(id));
		if (allSelected) {
			selectedMonitors = selectedMonitors.filter((id) => !filteredIds.includes(id));
		} else {
			selectedMonitors = [...new Set([...selectedMonitors, ...filteredIds])];
		}
	}

	function makeEnhance(clearSelection?: 'participants' | 'monitors') {
		return () => {
			submitting = true;
			return async ({ update, result }: any) => {
				submitting = false;
				if (result.type === 'success') {
					if (clearSelection === 'participants') selectedParticipants = [];
					if (clearSelection === 'monitors') selectedMonitors = [];
					addToast(result.data?.message ?? 'Berhasil.', 'success');
				} else if (result.type === 'failure') {
					addToast(result.data?.error ?? 'Terjadi kesalahan.', 'error');
				}
				await update();
			};
		};
	}
</script>

<div class="mb-6">
	<a
		href="/admin/exams/{data.examId}/rooms"
		class="text-sm font-bold text-primary-500 transition-all duration-100 hover:-translate-x-0.5"
		>← Kembali ke Detail Ujian</a
	>
</div>

{#if data.examRoom}
	<div class="card p-6 mb-6">
		<h1 class="text-2xl font-black text-(--text-primary)">{data.examRoom.exam?.name ?? 'Ujian'}</h1>
		<p class="mt-1 text-(--text-secondary) font-medium">
			Ruangan: <strong class="font-black text-(--text-primary)"
				>{data.examRoom.room?.name ?? data.examRoom.roomId}</strong
			>
		</p>
		<div class="mt-2 flex items-center gap-1.5 flex-wrap">
			<span class="text-xs font-bold text-(--text-secondary)">Alokasi Kelas:</span>
			{#if (data.examRoom.classes ?? []).length > 0}
				{#each data.examRoom.classes as c}
					<span
						class="text-xs font-bold px-2 py-0.5 rounded border border-(--nb-border) bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200"
					>
						{c.name}
					</span>
				{/each}
			{:else}
				<span class="text-xs font-bold text-red-600">⚠️ Belum ada kelas yang dipilih (0 murid)</span>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Peserta Panel -->
		<div class="card overflow-hidden">
			<div class="card-header">
				<h2 class="text-base font-black text-(--text-primary)">Peserta</h2>
				<p class="text-xs text-(--text-secondary) mt-0.5">
					{data.participants.length} terdaftar
					{#if remainingCapacity !== null}
						&middot; Sisa kursi: <strong class={remainingCapacity <= 0 ? 'text-red-600' : ''}
							>{remainingCapacity}</strong
						>
					{/if}
				</p>
			</div>
			<div class="p-5">
				{#if form?.action === 'addParticipants' && form?.error}
					<p class="text-xs text-red-600 mb-2">{form.error}</p>
				{/if}
				{#if (data.examRoom.classes ?? []).length === 0}
					<div class="p-3 mb-3 bg-amber-50 dark:bg-amber-950 border border-amber-300 rounded text-xs font-medium text-amber-800 dark:text-amber-200">
						⚠️ Ruangan ini belum dikelompokkan dengan kelas. Silakan atur kelas untuk ruangan ini di <a href="/admin/exams/{data.examId}/rooms" class="underline font-bold">Detail Ujian & Ruangan</a> agar siswa aktif dapat dipilih.
					</div>
				{/if}
				{#if data.availableParticipants.length > 0}
					<form method="POST" action="?/addParticipants" use:enhance={makeEnhance('participants')}>
						<input type="hidden" name="examRoomId" value={data.examRoomId} />
						<div class="mb-2">
							<input
								type="text"
								class="input-field text-sm"
								placeholder="Cari peserta..."
								bind:value={participantSearch}
							/>
						</div>
						{#if remainingCapacity !== null && remainingCapacity <= 0}
							<p class="text-xs text-red-600 mb-2">
								Ruangan sudah penuh — tidak bisa menambah peserta lagi.
							</p>
						{/if}
						<div class="flex items-center justify-between mb-2 text-xs text-(--text-secondary)">
							<label class="flex items-center gap-1.5 cursor-pointer select-none">
								<input
									type="checkbox"
									class="rounded"
									checked={filteredParticipants.length > 0 &&
										filteredParticipants.every((u: any) => selectedParticipants.includes(u.id))}
									disabled={capacityReached}
									onchange={toggleAllParticipants}
								/>
								Pilih semua ({filteredParticipants.length})
							</label>
							<span>{selectedParticipants.length} dipilih</span>
						</div>
						<div class="max-h-48 overflow-y-auto border-2 border-(--nb-border) rounded-lg mb-3">
							{#each filteredParticipants as u (u.id)}
								{@const checked = selectedParticipants.includes(u.id)}
								<label
									class="flex items-center gap-2 px-3 py-2 hover:bg-(--bg-secondary) cursor-pointer border-b border-(--nb-border) last:border-0"
									class:opacity-50={!checked && capacityReached}
								>
									<input
										type="checkbox"
										name="userId"
										value={u.id}
										class="rounded"
										{checked}
										disabled={!checked && capacityReached}
										onchange={() => toggleParticipant(u.id)}
									/>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-1.5 flex-wrap">
											<span class="text-sm text-(--text-primary) font-medium truncate">{u.fullname}</span>
											{#if u.className}
												<span class="text-[10px] font-bold px-1.5 py-0.2 rounded border border-(--nb-border) bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200">
													{u.className}
												</span>
											{/if}
										</div>
										<p class="text-xs text-(--text-secondary) truncate">{u.email}</p>
									</div>
								</label>
							{:else}
								<p class="text-xs text-(--text-secondary) p-3">
									{participantSearch ? 'Tidak ada hasil.' : 'Semua peserta dari kelas ini sudah terdaftar.'}
								</p>
							{/each}
						</div>
						<button
							type="submit"
							class="btn-primary w-full text-sm"
							disabled={submitting ||
								selectedParticipants.length === 0 ||
								(remainingCapacity !== null && selectedParticipants.length > remainingCapacity)}
						>
							{submitting
								? 'Menambahkan...'
								: `Tambah ${selectedParticipants.length > 0 ? selectedParticipants.length + ' ' : ''}Peserta`}
						</button>
					</form>
				{:else}
					<p class="text-xs text-(--text-secondary) mb-4">Semua peserta sudah ditambahkan.</p>
				{/if}
				{#if data.participants.length > 0}
					{@const groupedMap = (() => {
						const map = new Map<string, any[]>();
						for (const p of data.participants) {
							const cls = p.user?.className ?? 'Tanpa Kelas';
							if (!map.has(cls)) map.set(cls, []);
							map.get(cls)!.push(p);
						}
						return [...map.entries()].map(([className, participants]) => ({ className, participants })).sort((a, b) => a.className.localeCompare(b.className));
					})()}
					<div class="mt-4 border-t-2 border-(--nb-border) pt-4">
						<div class="flex items-center justify-between mb-2">
							<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
								Terdaftar ({data.participants.length})
							</p>
						</div>
						<div class="space-y-3 max-h-64 overflow-y-auto pr-1">
							{#each groupedMap as group (group.className)}
								<div class="border-2 border-(--nb-border) rounded-lg overflow-hidden">
									<div class="bg-(--bg-secondary) px-3 py-1.5 flex items-center justify-between border-b-2 border-(--nb-border)">
										<span class="text-xs font-black text-(--text-primary)">
											Kelas {group.className}
										</span>
										<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200 border border-(--nb-border)">
											{group.participants.length} Siswa
										</span>
									</div>
									<ul class="divide-y divide-(--nb-border)">
										{#each group.participants as p (p.id)}
											<li class="flex items-center justify-between text-sm py-1.5 px-3 hover:bg-(--bg-secondary)">
												<div class="min-w-0 flex-1">
													<p class="text-sm font-medium text-(--text-primary) truncate">{p.user?.fullname ?? p.userId}</p>
													{#if p.user?.email}
														<p class="text-xs text-(--text-secondary) truncate">{p.user.email}</p>
													{/if}
												</div>
												<form method="POST" action="?/removeParticipant" use:enhance={makeEnhance()}>
													<input type="hidden" name="id" value={p.id} />
													<IconButton
														variant="danger-outline"
														title="Hapus Peserta"
														type="button"
														onclick={(e) => {
															e.preventDefault();
															participantToRemove = p.id;
														}}
													>
														<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</IconButton>
												</form>
											</li>
										{/each}
									</ul>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Pengawas Panel -->
		<div class="card overflow-hidden">
			<div class="card-header">
				<h2 class="text-base font-black text-(--text-primary)">Pengawas Ruangan</h2>
				<p class="text-xs text-(--text-secondary) mt-0.5">{data.roomMonitors.length} terdaftar</p>
			</div>
			<div class="p-5">
				{#if form?.action === 'addRoomMonitors' && form?.error}
					<p class="text-xs text-red-600 mb-2">{form.error}</p>
				{/if}
				{#if data.availableSupervisors.length > 0}
					<form method="POST" action="?/addRoomMonitors" use:enhance={makeEnhance('monitors')}>
						<input type="hidden" name="examRoomId" value={data.examRoomId} />
						<div class="mb-2">
							<input
								type="text"
								class="input-field text-sm"
								placeholder="Cari pengawas..."
								bind:value={monitorSearch}
							/>
						</div>
						<div class="flex items-center justify-between mb-2 text-xs text-(--text-secondary)">
							<label class="flex items-center gap-1.5 cursor-pointer select-none">
								<input
									type="checkbox"
									class="rounded"
									checked={filteredMonitors.length > 0 &&
										filteredMonitors.every((u: any) => selectedMonitors.includes(u.id))}
									onchange={toggleAllMonitors}
								/>
								Pilih semua ({filteredMonitors.length})
							</label>
							<span>{selectedMonitors.length} dipilih</span>
						</div>
						<div class="max-h-48 overflow-y-auto border-2 border-(--nb-border) rounded-lg mb-3">
							{#each filteredMonitors as u (u.id)}
								<label
									class="flex items-center gap-2 px-3 py-2 hover:bg-(--bg-secondary) cursor-pointer border-b border-(--nb-border) last:border-0"
								>
									<input
										type="checkbox"
										name="userId"
										value={u.id}
										class="rounded"
										checked={selectedMonitors.includes(u.id)}
										onchange={() => toggleMonitor(u.id)}
									/>
									<div class="flex-1 min-w-0">
										<p class="text-sm text-(--text-primary) font-medium truncate">{u.fullname}</p>
										<p class="text-xs text-(--text-secondary) truncate">{u.email}</p>
									</div>
								</label>
							{:else}
								<p class="text-xs text-(--text-secondary) p-3">
									{monitorSearch ? 'Tidak ada hasil.' : 'Semua pengawas sudah terdaftar.'}
								</p>
							{/each}
						</div>
						<button
							type="submit"
							class="btn-primary w-full text-sm"
							disabled={submitting || selectedMonitors.length === 0}
						>
							{submitting
								? 'Menambahkan...'
								: `Tambah ${selectedMonitors.length > 0 ? selectedMonitors.length + ' ' : ''}Pengawas`}
						</button>
					</form>
				{:else}
					<p class="text-xs text-(--text-secondary) mb-4">Semua pengawas sudah ditambahkan.</p>
				{/if}
				{#if data.roomMonitors.length > 0}
					<div class="mt-4 border-t-2 border-(--nb-border) pt-4">
						<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide mb-2">
							Terdaftar
						</p>
						<ul class="space-y-1 max-h-48 overflow-y-auto">
							{#each data.roomMonitors as s (s.id)}
								<li
									class="flex items-center justify-between text-sm py-1 px-2 rounded bg-(--bg-secondary)"
								>
									<span class="text-(--text-primary) font-medium truncate"
										>{s.user?.fullname ?? s.userId}</span
									>
									<form method="POST" action="?/removeRoomMonitor" use:enhance={makeEnhance()}>
										<input type="hidden" name="id" value={s.id} />
										<IconButton
											variant="danger-outline"
											title="Hapus Pengawas"
											type="button"
											onclick={(e) => {
												e.preventDefault();
												monitorToRemove = s.id;
											}}
										>
											<svg
												class="w-3.5 h-3.5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</IconButton>
									</form>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="card p-8 text-center font-bold text-(--text-secondary)">
		Ruangan ujian tidak ditemukan.
	</div>
{/if}

<form
	bind:this={removeParticipantForm}
	method="POST"
	action="?/removeParticipant"
	use:enhance={makeEnhance()}
>
	<input type="hidden" name="id" value={participantToRemove} />
</form>

<form
	bind:this={removeMonitorForm}
	method="POST"
	action="?/removeRoomMonitor"
	use:enhance={makeEnhance()}
>
	<input type="hidden" name="id" value={monitorToRemove} />
</form>

<ConfirmModal
	show={!!participantToRemove}
	title="Konfirmasi Hapus"
	message="Hapus peserta ini?"
	onCancel={() => (participantToRemove = null)}
	onConfirm={() => {
		removeParticipantForm.requestSubmit();
		participantToRemove = null;
	}}
/>

<ConfirmModal
	show={!!monitorToRemove}
	title="Konfirmasi Hapus"
	message="Hapus pengawas ini?"
	onCancel={() => (monitorToRemove = null)}
	onConfirm={() => {
		removeMonitorForm.requestSubmit();
		monitorToRemove = null;
	}}
/>
