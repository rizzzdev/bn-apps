<script lang="ts">
	import { onMount } from 'svelte';
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import ActionButton from '$lib/components/atoms/ActionButton.svelte';
	import {
		appsStore,
		mapApiAppToAppItem,
		type ApiApplication,
		type AppItem
	} from '$lib/stores/apps';
	import { toast } from '$lib/stores/toast';
	import { apiClient } from '$lib/utils/api';

	// Props from server
	let {
		initialApplications = []
	}: {
		initialApplications?: ApiApplication[];
	} = $props();

	// State
	let searchQuery = $state('');
	let selectedIds = $state<string[]>([]);
	let currentPage = $state(1);
	const itemsPerPage = 6;

	// Modal states
	let isAddModalOpen = $state(false);
	let editingApp = $state<AppItem | null>(null);
	let deletingApp = $state<AppItem | null>(null);
	let isBulkDeleteModalOpen = $state(false);

	// Form fields for Add/Edit
	let formTitle = $state('');
	let formDescription = $state('');
	let formIcon = $state('apps');
	let formHref = $state('/');
	let formOrder = $state<number | null>(null);

	onMount(() => {
		if (initialApplications && initialApplications.length > 0) {
			appsStore.setAppsFromApi(initialApplications);
		} else {
			fetchApplications();
		}
	});

	async function fetchApplications() {
		try {
			const res = await apiClient('/master/applications?page=1&limit=100');
			if (res.ok) {
				const responseData = await res.json();
				if (responseData.data && Array.isArray(responseData.data)) {
					appsStore.setAppsFromApi(responseData.data);
				}
			} else {
				const json = await res.json().catch(() => ({}));
				toast.error(json.message || 'Gagal mengambil data aplikasi', 'Error API');
			}
		} catch (e) {
			console.error('Error fetching applications:', e);
			toast.error('Terjadi kesalahan saat terhubung ke Master Service', 'Koneksi Gagal');
		}
	}

	// Current apps list for SSR and hydration stability
	let currentApps = $derived(
		initialApplications && initialApplications.length > 0 && $appsStore.length === 0
			? initialApplications.map(mapApiAppToAppItem)
			: $appsStore
	);

	// Filtered apps based on search
	let filteredApps = $derived(
		currentApps.filter(
			(app) =>
				app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.icon.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.href.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Pagination calculations
	let totalPages = $derived(Math.max(1, Math.ceil(filteredApps.length / itemsPerPage)));

	// Current page items
	let paginatedApps = $derived(
		filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	// Reset page if search changes and out of range
	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = 1;
		}
	});

	// Select All logic for current page
	let isAllSelected = $derived(
		paginatedApps.length > 0 && paginatedApps.every((a) => selectedIds.includes(a.id))
	);

	function toggleSelectAll() {
		const pageIds = paginatedApps.map((a) => a.id);
		if (isAllSelected) {
			selectedIds = selectedIds.filter((id) => !pageIds.includes(id));
		} else {
			selectedIds = [...new Set([...selectedIds, ...pageIds])];
		}
	}

	function toggleSelectApp(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	// Modal openers
	function openAddModal() {
		formTitle = '';
		formDescription = '';
		formIcon = 'apps';
		formHref = '/';
		formOrder = null;
		isAddModalOpen = true;
	}

	function openEditModal(app: AppItem) {
		editingApp = app;
		formTitle = app.title;
		formDescription = app.description;
		formIcon = app.icon;
		formHref = app.href;
		formOrder = app.order;
	}

	function openDeleteModal(app: AppItem) {
		deletingApp = app;
	}

	// API Handlers
	async function handleSaveNewApp() {
		if (!formTitle.trim()) {
			toast.error('Nama aplikasi wajib diisi', 'Gagal Tambah Aplikasi');
			return;
		}
		try {
			const payload: Record<string, string | number | null> = {
				title: formTitle.trim(),
				description: formDescription.trim(),
				materialIcon: formIcon.trim() || 'apps',
				link: formHref.trim() || '/'
			};
			if (formOrder !== null && formOrder !== undefined) {
				payload.order = formOrder;
			}
			const res = await apiClient('/master/applications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const json = await res.json().catch(() => ({}));
			if (res.ok) {
				toast.success(
					json.message || `Aplikasi "${formTitle}" berhasil ditambahkan`,
					'Tambah Aplikasi'
				);
				isAddModalOpen = false;
				await fetchApplications();
			} else {
				toast.error(json.message || 'Gagal menambahkan aplikasi', 'Gagal Tambah Aplikasi');
			}
		} catch (err) {
			console.error('Save new app error:', err);
			toast.error('Terjadi kesalahan saat menyimpan data ke server', 'Error');
		}
	}

	async function handleSaveEditApp() {
		if (!editingApp) return;
		if (!formTitle.trim()) {
			toast.error('Nama aplikasi wajib diisi', 'Gagal Update Aplikasi');
			return;
		}
		try {
			const payload: Record<string, string | number | null> = {
				title: formTitle.trim(),
				description: formDescription.trim(),
				materialIcon: formIcon.trim() || 'apps',
				link: formHref.trim() || '/'
			};
			if (formOrder !== null && formOrder !== undefined) {
				payload.order = formOrder;
			}
			const res = await apiClient(`/master/applications/${editingApp.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const json = await res.json().catch(() => ({}));
			if (res.ok) {
				toast.success(
					json.message || `Aplikasi "${formTitle}" berhasil diperbarui`,
					'Update Aplikasi'
				);
				editingApp = null;
				await fetchApplications();
			} else {
				toast.error(json.message || 'Gagal memperbarui aplikasi', 'Gagal Update Aplikasi');
			}
		} catch (err) {
			console.error('Save edit app error:', err);
			toast.error('Terjadi kesalahan saat memperbarui data ke server', 'Error');
		}
	}

	async function handleConfirmDelete() {
		if (!deletingApp) return;
		const name = deletingApp.title;
		try {
			const res = await apiClient(`/master/applications/${deletingApp.id}`, {
				method: 'DELETE'
			});

			const json = await res.json().catch(() => ({}));
			if (res.ok) {
				selectedIds = selectedIds.filter((id) => id !== deletingApp?.id);
				toast.success(json.message || `Aplikasi "${name}" berhasil dihapus`, 'Hapus Aplikasi');
				deletingApp = null;
				await fetchApplications();
			} else {
				toast.error(json.message || 'Gagal menghapus aplikasi', 'Gagal Hapus Aplikasi');
			}
		} catch (err) {
			console.error('Delete app error:', err);
			toast.error('Terjadi kesalahan saat menghapus data di server', 'Error');
		}
	}

	async function handleConfirmBulkDelete() {
		if (selectedIds.length === 0) return;
		const count = selectedIds.length;
		try {
			const res = await apiClient('/master/applications/batch/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: selectedIds })
			});

			const json = await res.json().catch(() => ({}));
			if (res.ok) {
				const deletedIds = [...selectedIds];
				selectedIds = [];
				isBulkDeleteModalOpen = false;
				appsStore.bulkDeleteApps(deletedIds);
				toast.success(json.message || `${count} aplikasi berhasil dihapus massal`, 'Bulk Delete');
				await fetchApplications();
			} else {
				toast.error(json.message || 'Gagal menghapus aplikasi terpilih', 'Gagal Bulk Delete');
			}
		} catch (err) {
			console.error('Bulk delete apps error:', err);
			toast.error('Terjadi kesalahan saat menghapus data massal di server', 'Error');
		}
	}

	function getPaginationPages(current: number, total: number): (number | '...')[] {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}
		const pages: (number | '...')[] = [];
		pages.push(1);

		if (current > 3) {
			pages.push('...');
		}

		const start = Math.max(2, current - 1);
		const end = Math.min(total - 1, current + 1);

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		if (current < total - 2) {
			pages.push('...');
		}

		pages.push(total);

		return pages;
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}
</script>

<div
	class="neo-border neo-shadow relative flex h-full flex-col space-y-4 overflow-hidden rounded-xl bg-surface p-1"
>
	<!-- Header / Toolbar -->
	<div class="flex flex-col gap-3 border-b-4 border-black bg-primary-fixed p-4">
		<!-- Top Action Buttons Row -->
		<div class="flex w-full flex-wrap items-center justify-end gap-3">
			{#if selectedIds.length > 0}
				<Button
					variant="primary"
					className="!w-auto !py-2.5 !px-5 !bg-error text-white font-label-bold"
					onclick={() => (isBulkDeleteModalOpen = true)}
				>
					<span class="inline-flex items-center justify-center gap-2">
						<span class="material-symbols-outlined text-lg">delete</span>
						<span>Hapus Terpilih ({selectedIds.length})</span>
					</span>
				</Button>
			{/if}

			<Button
				variant="primary"
				className="!w-auto !py-2.5 !px-5 !bg-tertiary-container text-on-tertiary font-label-bold"
				onclick={openAddModal}
			>
				<span class="inline-flex items-center justify-center gap-2">
					<span class="material-symbols-outlined text-lg">add</span>
					<span>Tambah Aplikasi Baru</span>
				</span>
			</Button>
		</div>

		<!-- Full Width Searchbar Row -->
		<div class="w-full">
			<Input
				bind:value={searchQuery}
				placeholder="Cari aplikasi (Nama, deskripsi, icon)..."
				icon="search"
				className="w-full bg-white"
			/>
		</div>
	</div>

	<!-- Table -->
	<div class="flex-grow overflow-x-auto bg-surface-container-lowest">
		<table class="min-w-full text-left text-sm text-on-surface">
			<thead
				class="border-b-4 border-black bg-surface-variant font-label-bold text-on-surface uppercase"
			>
				<tr>
					<th class="w-12 border-r-2 border-black px-4 py-4 text-center">
						<Checkbox
							checked={isAllSelected}
							onchange={(e) => {
								e.preventDefault();
								toggleSelectAll();
							}}
						/>
					</th>
					<th class="border-r-2 border-black px-6 py-4">Nama Aplikasi</th>
					<th class="border-r-2 border-black px-6 py-4">Deskripsi</th>
					<th class="border-r-2 border-black px-6 py-4">Material Icon</th>
					<th class="border-r-2 border-black px-6 py-4">URL Target</th>
					<th class="w-20 border-r-2 border-black px-6 py-4 text-center">Order</th>
					<th class="w-40 px-6 py-4 text-center">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedApps as app (app.id)}
					<tr
						class="border-b-4 border-black transition-colors hover:bg-surface-container-low {selectedIds.includes(
							app.id
						)
							? 'bg-primary-fixed-dim/20'
							: ''}"
					>
						<td class="border-r-2 border-black px-4 py-4 text-center">
							<Checkbox
								checked={selectedIds.includes(app.id)}
								onchange={(e) => {
									e.preventDefault();
									toggleSelectApp(app.id);
								}}
							/>
						</td>
						<td class="border-r-2 border-black px-6 py-4 font-headline-md text-base font-bold">
							{app.title}
						</td>
						<td
							class="max-w-xs border-r-2 border-black px-6 py-4 text-xs leading-relaxed text-on-surface-variant md:text-sm"
						>
							{app.description}
						</td>
						<td class="border-r-2 border-black px-6 py-4">
							<div
								class="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-secondary-fixed px-3 py-1.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							>
								<span class="material-symbols-outlined text-xl select-none">{app.icon}</span>
								<code class="font-mono text-xs font-bold">{app.icon}</code>
							</div>
						</td>
						<td class="border-r-2 border-black px-6 py-4 font-mono text-xs text-primary underline">
							{app.href}
						</td>
						<td class="border-r-2 border-black px-4 py-4 text-center font-mono text-sm font-bold">
							{app.order !== null && app.order !== undefined ? app.order : '-'}
						</td>
						<td class="px-4 py-4 text-center">
							<div class="flex items-center justify-center gap-2">
								<ActionButton
									icon="edit"
									label="Update Aplikasi"
									variant="secondary"
									onclick={() => openEditModal(app)}
								/>
								<ActionButton
									icon="delete"
									label="Hapus Aplikasi"
									variant="danger"
									onclick={() => openDeleteModal(app)}
								/>
							</div>
						</td>
					</tr>
				{/each}
				{#if paginatedApps.length === 0}
					<tr>
						<td colspan="7" class="px-6 py-8 text-center font-body-md text-on-surface-variant">
							Tidak ada data aplikasi yang ditemukan.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	<div class="flex items-center justify-between border-t-4 border-black bg-surface-variant p-4">
		<span class="font-label-bold text-sm text-on-surface">
			Halaman {currentPage} dari {totalPages} (Total Data: {filteredApps.length})
		</span>
		<div class="flex gap-2">
			<Button
				variant="secondary"
				className="!w-auto !py-1.5 !px-3"
				disabled={currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				Prev
			</Button>

			{#each getPaginationPages(currentPage, totalPages) as item, idx (idx)}
				{#if item === '...'}
					<span class="px-2 py-1.5 font-bold text-on-surface">...</span>
				{:else}
					<Button
						variant={currentPage === item ? 'primary' : 'secondary'}
						className="!w-auto !py-1.5 !px-3 {currentPage === item
							? '!bg-primary-container text-white'
							: ''}"
						onclick={() => goToPage(item)}
					>
						{item}
					</Button>
				{/if}
			{/each}

			<Button
				variant="secondary"
				className="!w-auto !py-1.5 !px-3"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(currentPage + 1)}
			>
				Next
			</Button>
		</div>
	</div>
</div>

<!-- Add App Modal -->
{#if isAddModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="neo-border neo-shadow-lg relative w-full max-w-lg rounded-2xl bg-surface p-6">
			<button
				class="neo-border neo-shadow-sm hover:neo-shadow-lg absolute -top-4 -right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-error text-white transition-all hover:-translate-y-1"
				onclick={() => (isAddModalOpen = false)}
				aria-label="Tutup Modal"
			>
				<span class="material-symbols-outlined text-xl font-bold">close</span>
			</button>

			<h3 class="mb-1 font-headline-lg text-2xl text-on-surface">Tambah Aplikasi Baru</h3>
			<p class="mb-6 border-b-2 border-black pb-3 font-body-md text-sm text-on-surface-variant">
				Masukkan informasi aplikasi yang akan ditampilkan di Dashboard.
			</p>

			<div class="mb-6 flex flex-col gap-4">
				<div>
					<label for="app-title" class="mb-1 block font-label-bold text-sm">Nama Aplikasi *</label>
					<Input
						id="app-title"
						bind:value={formTitle}
						placeholder="Contoh: SIAKAD (Akademik)"
						className="w-full bg-white"
					/>
				</div>

				<div>
					<label for="app-desc" class="mb-1 block font-label-bold text-sm">Deskripsi Aplikasi</label
					>
					<textarea
						id="app-desc"
						bind:value={formDescription}
						placeholder="Penjelasan singkat fungsi aplikasi..."
						rows="3"
						class="neo-border w-full rounded-lg bg-white p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none"
					></textarea>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label for="app-icon" class="mb-1 block font-label-bold text-sm"
							>Material Icon String</label
						>
						<div class="flex items-center gap-2">
							<Input
								id="app-icon"
								bind:value={formIcon}
								placeholder="school"
								className="w-full bg-white"
							/>
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 border-black bg-secondary-fixed text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							>
								<span class="material-symbols-outlined text-xl">{formIcon || 'apps'}</span>
							</div>
						</div>
					</div>

					<div>
						<label for="app-href" class="mb-1 block font-label-bold text-sm"
							>URL Target (href)</label
						>
						<Input
							id="app-href"
							bind:value={formHref}
							placeholder="/"
							className="w-full bg-white"
						/>
					</div>
				</div>

				<div>
					<label for="app-order" class="mb-1 block font-label-bold text-sm"
						>Urutan Tampilan (Order)</label
					>
					<div
						class="neo-border neo-focus relative rounded-lg bg-surface-container-lowest transition-all"
					>
						<input
							id="app-order"
							type="number"
							min="0"
							value={formOrder === null || formOrder === undefined ? '' : formOrder}
							oninput={(e) => {
								const val = (e.target as HTMLInputElement).value;
								formOrder = val === '' ? null : Math.max(0, parseInt(val, 10) || 0);
							}}
							placeholder="Contoh: 1 (opsional, semakin kecil tampil duluan)"
							class="w-full rounded-lg border-none bg-transparent px-3 py-2.5 font-label-bold text-sm text-on-surface outline-none placeholder:text-outline focus:ring-0"
						/>
					</div>
					<p class="mt-1 text-xs text-on-surface-variant">
						Kosongkan jika tidak ingin mengatur urutan.
					</p>
				</div>
			</div>

			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					className="!w-auto !py-2 !px-4"
					onclick={() => (isAddModalOpen = false)}
				>
					Batal
				</Button>
				<Button
					variant="primary"
					className="!w-auto !py-2 !px-4 !bg-primary-container text-white"
					onclick={handleSaveNewApp}
				>
					Simpan Aplikasi
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit App Modal -->
{#if editingApp}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="neo-border neo-shadow-lg relative w-full max-w-lg rounded-2xl bg-surface p-6">
			<button
				class="neo-border neo-shadow-sm hover:neo-shadow-lg absolute -top-4 -right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-error text-white transition-all hover:-translate-y-1"
				onclick={() => (editingApp = null)}
				aria-label="Tutup Modal"
			>
				<span class="material-symbols-outlined text-xl font-bold">close</span>
			</button>

			<h3 class="mb-1 font-headline-lg text-2xl text-on-surface">Update Data Aplikasi</h3>
			<p class="mb-6 border-b-2 border-black pb-3 font-body-md text-sm text-on-surface-variant">
				Ubah detail aplikasi <span class="font-bold text-primary">{editingApp.title}</span>.
			</p>

			<div class="mb-6 flex flex-col gap-4">
				<div>
					<label for="edit-app-title" class="mb-1 block font-label-bold text-sm"
						>Nama Aplikasi *</label
					>
					<Input
						id="edit-app-title"
						bind:value={formTitle}
						placeholder="Nama aplikasi..."
						className="w-full bg-white"
					/>
				</div>

				<div>
					<label for="edit-app-desc" class="mb-1 block font-label-bold text-sm"
						>Deskripsi Aplikasi</label
					>
					<textarea
						id="edit-app-desc"
						bind:value={formDescription}
						placeholder="Penjelasan singkat..."
						rows="3"
						class="neo-border w-full rounded-lg bg-white p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none"
					></textarea>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label for="edit-app-icon" class="mb-1 block font-label-bold text-sm"
							>Material Icon String</label
						>
						<div class="flex items-center gap-2">
							<Input
								id="edit-app-icon"
								bind:value={formIcon}
								placeholder="school"
								className="w-full bg-white"
							/>
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 border-black bg-secondary-fixed text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							>
								<span class="material-symbols-outlined text-xl">{formIcon || 'apps'}</span>
							</div>
						</div>
					</div>

					<div>
						<label for="edit-app-href" class="mb-1 block font-label-bold text-sm"
							>URL Target (href)</label
						>
						<Input
							id="edit-app-href"
							bind:value={formHref}
							placeholder="/"
							className="w-full bg-white"
						/>
					</div>
				</div>

				<div>
					<label for="edit-app-order" class="mb-1 block font-label-bold text-sm"
						>Urutan Tampilan (Order)</label
					>
					<div
						class="neo-border neo-focus relative rounded-lg bg-surface-container-lowest transition-all"
					>
						<input
							id="edit-app-order"
							type="number"
							min="0"
							value={formOrder === null || formOrder === undefined ? '' : formOrder}
							oninput={(e) => {
								const val = (e.target as HTMLInputElement).value;
								formOrder = val === '' ? null : Math.max(0, parseInt(val, 10) || 0);
							}}
							placeholder="Contoh: 1 (opsional, semakin kecil tampil duluan)"
							class="w-full rounded-lg border-none bg-transparent px-3 py-2.5 font-label-bold text-sm text-on-surface outline-none placeholder:text-outline focus:ring-0"
						/>
					</div>
					<p class="mt-1 text-xs text-on-surface-variant">
						Kosongkan jika tidak ingin mengatur urutan.
					</p>
				</div>
			</div>

			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					className="!w-auto !py-2 !px-4"
					onclick={() => (editingApp = null)}
				>
					Batal
				</Button>
				<Button
					variant="primary"
					className="!w-auto !py-2 !px-4 !bg-primary-container text-white"
					onclick={handleSaveEditApp}
				>
					Simpan Perubahan
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Single App Confirmation Modal -->
{#if deletingApp}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="neo-border neo-shadow-lg relative w-full max-w-md rounded-2xl bg-surface p-6">
			<button
				class="neo-border neo-shadow-sm hover:neo-shadow-lg absolute -top-4 -right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-error text-white transition-all hover:-translate-y-1"
				onclick={() => (deletingApp = null)}
				aria-label="Tutup Modal"
			>
				<span class="material-symbols-outlined text-xl font-bold">close</span>
			</button>

			<h3 class="mb-2 font-headline-lg text-2xl text-error text-on-surface">Hapus Aplikasi</h3>
			<p class="mb-6 border-b-2 border-black pb-4 font-body-md text-on-surface-variant">
				Apakah Anda yakin ingin menghapus aplikasi <span class="font-bold text-black"
					>"{deletingApp.title}"</span
				>? Tindakan ini tidak dapat dibatalkan.
			</p>

			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					className="!w-auto !py-2 !px-4"
					onclick={() => (deletingApp = null)}
				>
					Batal
				</Button>
				<Button
					variant="primary"
					className="!w-auto !py-2 !px-4 !bg-error text-white"
					onclick={handleConfirmDelete}
				>
					Ya, Hapus
				</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Bulk Delete Confirmation Modal -->
{#if isBulkDeleteModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="neo-border neo-shadow-lg relative w-full max-w-md rounded-2xl bg-surface p-6">
			<button
				class="neo-border neo-shadow-sm hover:neo-shadow-lg absolute -top-4 -right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-error text-white transition-all hover:-translate-y-1"
				onclick={() => (isBulkDeleteModalOpen = false)}
				aria-label="Tutup Modal"
			>
				<span class="material-symbols-outlined text-xl font-bold">close</span>
			</button>

			<h3 class="mb-2 font-headline-lg text-2xl text-error text-on-surface">
				Hapus Massal Aplikasi
			</h3>
			<p class="mb-6 border-b-2 border-black pb-4 font-body-md text-on-surface-variant">
				Apakah Anda yakin ingin menghapus <span class="font-bold text-black"
					>{selectedIds.length} aplikasi terpilih</span
				>? Tindakan ini akan menghapus semua aplikasi terpilih dari daftar.
			</p>

			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					className="!w-auto !py-2 !px-4"
					onclick={() => (isBulkDeleteModalOpen = false)}
				>
					Batal
				</Button>
				<Button
					variant="primary"
					className="!w-auto !py-2 !px-4 !bg-error text-white"
					onclick={handleConfirmBulkDelete}
				>
					Ya, Hapus Semua ({selectedIds.length})
				</Button>
			</div>
		</div>
	</div>
{/if}
