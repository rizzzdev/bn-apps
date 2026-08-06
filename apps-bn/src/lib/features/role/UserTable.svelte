<script lang="ts">
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import ActionButton from '$lib/components/atoms/ActionButton.svelte';

	import { goto } from '$app/navigation';
	import { env as publicEnv } from '$env/dynamic/public';
	import { toast } from '$lib/stores/toast';

	const getApiUrl = (): string => {
		const raw = (publicEnv.PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
		return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
	};

	export type Role = { id: string; name: string; description?: string };
	export type User = {
		id: string;
		email: string;
		roles: string[];
		status: string;
		createdAt: string;
	};
	export type Pagination = {
		currentPage: number;
		totalPage: number;
		totalData: number;
		dataPerPage: number;
	};

	let {
		users: initialUsers,
		roles,
		pagination
	}: { users: User[]; roles: Role[]; pagination?: Pagination } = $props();

	// State: writable $derived — mengikuti data server (initialUsers) dan
	// dapat di-override untuk optimistic update saat mengubah role.
	let users = $derived(initialUsers || []);

	let searchQuery = $state('');
	let selectedIds = $state<string[]>([]);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Editing state for single user modal
	let editingUser = $state<User | null>(null);

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

	function goToPage(newPage: number) {
		if (newPage < 1 || (pagination && newPage > pagination.totalPage)) return;
		const url = new URL(window.location.href);
		url.searchParams.set('page', newPage.toString());
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	// Handlers
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const url = new URL(window.location.href);
			if (searchQuery.trim()) {
				url.searchParams.set('search', searchQuery.trim());
			} else {
				url.searchParams.delete('search');
			}
			url.searchParams.set('page', '1');
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
		}, 400);
	}

	function openRoleModal(user: User) {
		editingUser = { ...user, roles: user.roles ? [...user.roles] : [] };
	}

	function toggleSingleUserRole(roleId: string) {
		if (!editingUser) return;
		let currentRoles = editingUser.roles ? [...editingUser.roles] : [];
		if (currentRoles.includes(roleId)) {
			currentRoles = currentRoles.filter((r) => r !== roleId);
		} else {
			currentRoles.push(roleId);
		}
		editingUser.roles = currentRoles;
	}

	async function saveSingleUserRoles() {
		if (!editingUser) return;
		const targetUser = editingUser;
		editingUser = null; // Close modal

		const index = users.findIndex((u) => u.id === targetUser.id);
		if (index === -1) return;

		const previousRoles = users[index].roles;
		users[index].roles = targetUser.roles; // Optimistic update

		try {
			const apiUrl = getApiUrl();
			const res = await fetch(`${apiUrl}/auth/users/${targetUser.id}/roles`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ roles: targetUser.roles })
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.message || 'Gagal update role');
			}
			toast.success(
				`Role pengguna ${targetUser.email} berhasil diperbarui`,
				'Berhasil Assign Role'
			);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : 'Gagal memperbarui hak akses pengguna';
			console.error(e);
			users[index].roles = previousRoles;
			toast.error(message, 'Gagal Assign Role');
		}
	}

	// Bulk Actions
	function isRoleAssignedToAllSelected(roleId: string) {
		if (selectedIds.length === 0) return false;
		const selectedUsers = users.filter((u) => selectedIds.includes(u.id));
		return selectedUsers.every((u) => (u.roles || []).includes(roleId));
	}

	async function toggleBulkRole(roleId: string) {
		const isAssignedToAll = isRoleAssignedToAllSelected(roleId);

		// Calculate final states for API
		let allUserUpdates = users.map((user) => {
			if (!selectedIds.includes(user.id)) return user;

			let newRoles = user.roles ? [...user.roles] : [];
			if (isAssignedToAll) {
				newRoles = newRoles.filter((id) => id !== roleId);
			} else {
				if (!newRoles.includes(roleId)) newRoles.push(roleId);
			}
			return { ...user, roles: newRoles };
		});

		// Optimistic update
		const previousUsers = [...users];
		users = allUserUpdates;

		try {
			const apiUrl = getApiUrl();
			await Promise.all(
				selectedIds.map(async (id) => {
					const u = allUserUpdates.find((user) => user.id === id);
					const res = await fetch(`${apiUrl}/auth/users/${id}/roles`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'include',
						body: JSON.stringify({ roles: u?.roles || [] })
					});
					if (!res.ok) {
						const errData = await res.json().catch(() => ({}));
						throw new Error(errData.message || 'Gagal update role');
					}
				})
			);
			toast.success(
				`Role berhasil diperbarui untuk ${selectedIds.length} pengguna`,
				'Bulk Assign Role'
			);
		} catch (e: unknown) {
			const message =
				e instanceof Error ? e.message : 'Gagal memperbarui hak akses pengguna secara massal';
			console.error(e);
			users = previousUsers;
			toast.error(message, 'Gagal Bulk Assign Role');
		}
	}

	function toggleUserSelection(userId: string) {
		if (selectedIds.includes(userId)) {
			selectedIds = selectedIds.filter((id) => id !== userId);
		} else {
			selectedIds = [...selectedIds, userId];
		}
	}

	function toggleSelectAll() {
		if (isAllSelected) {
			const userIds = users.map((u) => u.id);
			selectedIds = selectedIds.filter((id) => !userIds.includes(id));
		} else {
			const userIds = users.map((u) => u.id);
			selectedIds = [...new Set([...selectedIds, ...userIds])];
		}
	}

	let isAllSelected = $derived(users.length > 0 && users.every((u) => selectedIds.includes(u.id)));

	let isBulkModalOpen = $state(false);

	function getRoleName(roleId: string) {
		const r = roles.find((item) => item.id === roleId);
		return r ? r.name : roleId;
	}
</script>

<div
	class="neo-border neo-shadow relative flex h-full flex-col space-y-4 overflow-hidden rounded-xl bg-surface p-1"
>
	<!-- Header / Toolbar -->
	<div class="flex flex-col gap-4 border-b-4 border-black bg-primary-fixed p-4">
		<div class="w-full">
			<Input
				bind:value={searchQuery}
				placeholder="Cari pengguna (Email)..."
				icon="search"
				onchange={handleSearchInput}
				onkeyup={handleSearchInput}
				className="w-full bg-white"
			/>
		</div>

		<!-- Bulk Actions Panel (Trigger) -->
		{#if selectedIds.length > 0}
			<div class="flex w-full items-center justify-end gap-4">
				<Button
					variant="primary"
					className="!w-auto !py-2 !px-4 !bg-tertiary-container text-sm"
					onclick={() => (isBulkModalOpen = true)}
				>
					Atur Role Massal ({selectedIds.length})
				</Button>
			</div>
		{/if}
	</div>

	<!-- Table -->
	<div class="flex-grow overflow-x-auto bg-surface-container-lowest">
		<table class="min-w-full text-left text-sm text-on-surface">
			<thead class="border-b-4 border-black bg-surface-variant font-label-bold text-on-surface">
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
					<th class="border-r-2 border-black px-6 py-4">Email</th>
					<th class="border-r-2 border-black px-6 py-4">Roles saat ini</th>
					<th class="w-36 px-6 py-4 text-center">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each users as user (user.id)}
					<tr
						class="border-b-4 border-black transition-colors hover:bg-surface-container-low {selectedIds.includes(
							user.id
						)
							? 'bg-primary-fixed-dim/20'
							: ''}"
					>
						<td class="border-r-2 border-black px-4 py-4 text-center">
							<Checkbox
								checked={selectedIds.includes(user.id)}
								onchange={(e) => {
									e.preventDefault();
									toggleUserSelection(user.id);
								}}
							/>
						</td>
						<td class="border-r-2 border-black px-6 py-4 font-headline-md"
							>{user.email || user.id}</td
						>
						<td class="border-r-2 border-black px-6 py-4">
							<div class="flex flex-wrap gap-2">
								{#if (user.roles || []).length > 0}
									{#each user.roles as roleId (roleId)}
										<span
											class="inline-block rounded border border-black bg-secondary-container px-2.5 py-1 font-label-bold text-xs text-on-secondary-container uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
										>
											{getRoleName(roleId)}
										</span>
									{/each}
								{:else}
									<span class="text-xs text-on-surface-variant italic">Tanpa role</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-4 text-center">
							<ActionButton
								icon="admin_panel_settings"
								label="Atur Role Pengguna"
								variant="secondary"
								onclick={() => openRoleModal(user)}
							/>
						</td>
					</tr>
				{/each}
				{#if users.length === 0}
					<tr>
						<td colspan="4" class="px-6 py-8 text-center font-body-md text-on-surface-variant"
							>Tidak ada data pengguna yang sesuai.</td
						>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	<div
		class="flex flex-col gap-3 border-t-4 border-black bg-surface-variant p-4 md:flex-row md:items-center md:justify-between"
	>
		<span class="text-center font-label-bold text-xs text-on-surface md:text-left md:text-sm">
			Halaman {pagination?.currentPage ?? 1} dari {pagination?.totalPage ?? 1} (Total Data: {pagination?.totalData ??
				users.length})
		</span>
		<div class="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
			<Button
				variant="secondary"
				className="!w-auto !py-1 !px-2 !text-xs md:!py-1.5 md:!px-3 md:!text-sm"
				disabled={(pagination?.currentPage ?? 1) <= 1}
				onclick={() => goToPage((pagination?.currentPage ?? 1) - 1)}
			>
				Prev
			</Button>

			{#each getPaginationPages(pagination?.currentPage ?? 1, pagination?.totalPage ?? 1) as item, idx (idx)}
				{#if item === '...'}
					<span class="px-1.5 py-1 text-xs font-bold text-on-surface md:px-2 md:py-1.5 md:text-sm"
						>...</span
					>
				{:else}
					<Button
						variant={(pagination?.currentPage ?? 1) === item ? 'primary' : 'secondary'}
						className="!w-auto !py-1 !px-2 !text-xs md:!py-1.5 md:!px-3 md:!text-sm {(pagination?.currentPage ??
							1) === item
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
				className="!w-auto !py-1 !px-2 !text-xs md:!py-1.5 md:!px-3 md:!text-sm"
				disabled={(pagination?.currentPage ?? 1) >= (pagination?.totalPage ?? 1)}
				onclick={() => goToPage((pagination?.currentPage ?? 1) + 1)}
			>
				Next
			</Button>
		</div>
	</div>
</div>

<!-- Single User Role Modal -->
{#if editingUser}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="neo-border neo-shadow-lg relative w-full max-w-md rounded-2xl bg-surface p-6">
			<button
				class="neo-border neo-shadow-sm hover:neo-shadow-lg absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-error text-white transition-all hover:-translate-y-1"
				onclick={() => (editingUser = null)}
				aria-label="Tutup Modal"
			>
				<span class="material-symbols-outlined text-xl font-bold">close</span>
			</button>

			<h3 class="mb-1 font-headline-lg text-2xl text-on-surface">Atur Role Pengguna</h3>
			<p class="mb-6 border-b-2 border-black pb-4 font-body-md text-sm text-on-surface-variant">
				Pengguna: <span class="font-bold text-primary">{editingUser.email || editingUser.id}</span>
			</p>

			<div class="mb-8 flex flex-col gap-3">
				{#each roles as role (role.id)}
					<div
						class="neo-border flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 transition-colors hover:bg-surface-container-low"
					>
						<div>
							<div class="font-label-bold text-base">{role.name}</div>
							{#if role.description}
								<div class="text-xs text-on-surface-variant">{role.description}</div>
							{/if}
						</div>
						<Checkbox
							checked={(editingUser.roles || []).includes(role.id)}
							onchange={(e) => {
								e.preventDefault();
								toggleSingleUserRole(role.id);
							}}
						/>
					</div>
				{/each}
			</div>

			<div class="flex justify-end gap-3">
				<Button
					variant="secondary"
					className="!w-auto !py-2 !px-4"
					onclick={() => (editingUser = null)}>Batal</Button
				>
				<Button variant="primary" className="!w-auto !py-2 !px-4" onclick={saveSingleUserRoles}
					>Simpan</Button
				>
			</div>
		</div>
	</div>
{/if}

<!-- Bulk Roles Modal -->
{#if isBulkModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="neo-border neo-shadow-lg relative w-full max-w-md rounded-2xl bg-surface p-6">
			<button
				class="neo-border neo-shadow-sm hover:neo-shadow-lg absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-error text-white transition-all hover:-translate-y-1"
				onclick={() => (isBulkModalOpen = false)}
				aria-label="Tutup Modal"
			>
				<span class="material-symbols-outlined text-xl font-bold">close</span>
			</button>

			<h3 class="mb-2 font-headline-lg text-2xl text-on-surface">Atur Role Massal</h3>
			<p class="mb-6 border-b-2 border-black pb-4 font-body-md text-on-surface-variant">
				Pilih role yang ingin ditetapkan untuk <span class="font-bold text-primary"
					>{selectedIds.length} pengguna terpilih</span
				>.
			</p>

			<div class="mb-8 flex flex-col gap-4">
				{#each roles as role (role.id)}
					<div
						class="neo-border flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 transition-colors hover:bg-surface-container-low"
					>
						<div>
							<div class="font-label-bold text-base">{role.name}</div>
						</div>
						<Checkbox
							checked={isRoleAssignedToAllSelected(role.id)}
							onchange={(e) => {
								e.preventDefault();
								toggleBulkRole(role.id);
							}}
						/>
					</div>
				{/each}
			</div>

			<Button variant="primary" onclick={() => (isBulkModalOpen = false)}>Selesai</Button>
		</div>
	</div>
{/if}
