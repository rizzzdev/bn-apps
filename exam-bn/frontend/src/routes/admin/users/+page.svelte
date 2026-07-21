<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/modal.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { addToast } from '$lib/stores/toast';
	import type { PageData, ActionData } from './$types';
	import type { User } from '$lib/types';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreate = $state(false);
	let showImport = $state(false);
	let editItem = $state<User | null>(null);
	let userToRemove = $state<User | null>(null);
	let removeForm: HTMLFormElement;
	let submitting = $state(false);
	let activeTab = $state<'PARTICIPANT' | 'SUPERVISOR' | 'ADMIN'>('PARTICIPANT');
	let page = $state(1);

	const roleLabels: Record<string, string> = {
		ADMIN: 'Admin',
		SUPERVISOR: 'Pengawas',
		PARTICIPANT: 'Peserta'
	};
	const roleVariant: Record<string, 'purple' | 'info' | 'success'> = {
		ADMIN: 'purple',
		SUPERVISOR: 'info',
		PARTICIPANT: 'success'
	};

	const PAGE_SIZE = 10;
	const filteredUsers = $derived(data.users.filter((u: User) => u.role === activeTab));
	const paginatedUsers = $derived(filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
	$effect(() => {
		activeTab;
		page = 1;
	});

	const counts = $derived({
		PARTICIPANT: data.users.filter((u: User) => u.role === 'PARTICIPANT').length,
		SUPERVISOR: data.users.filter((u: User) => u.role === 'SUPERVISOR').length,
		ADMIN: data.users.filter((u: User) => u.role === 'ADMIN').length
	});

	const tabs: Array<{ key: 'PARTICIPANT' | 'SUPERVISOR' | 'ADMIN'; label: string }> = [
		{ key: 'PARTICIPANT', label: 'Peserta' },
		{ key: 'SUPERVISOR', label: 'Pengawas' },
		{ key: 'ADMIN', label: 'Admin' }
	];

	function closeModals() {
		showCreate = false;
		showImport = false;
		editItem = null;
	}

	function makeEnhance(closeOnSuccess = true) {
		return () => {
			submitting = true;
			return async ({ update, result }: any) => {
				submitting = false;
				if (result.type === 'success') {
					if (closeOnSuccess) closeModals();
					addToast(result.data?.message ?? 'Berhasil.', 'success');
				} else if (result.type === 'failure') {
					addToast(result.data?.error ?? 'Terjadi kesalahan.', 'error');
				}
				await update();
			};
		};
	}
</script>

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
	<div>
		<h1 class="text-2xl font-black text-(--text-primary)">Manajemen User</h1>
		<p class="text-sm font-medium text-(--text-secondary) mt-1">
			Kelola data peserta, pengawas, dan admin.
		</p>
	</div>
	<div class="flex gap-2">
		<Button variant="secondary" onclick={() => (showImport = true)}>
			<svg class="mr-2 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
				/>
			</svg>
			Import Excel
		</Button>
		<Button onclick={() => (showCreate = true)}>
			<svg class="mr-2 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tambah User
		</Button>
	</div>
</div>

<!-- Tabs -->
<div class="flex gap-2 mb-0 flex-wrap">
	{#each tabs as tab}
		<button
			onclick={() => (activeTab = tab.key)}
			class={activeTab === tab.key ? 'nb-tab-active' : 'nb-tab'}
		>
			{tab.label}
			<span
				class="ml-2 inline-flex items-center justify-center min-w-5 px-1.5 py-0.5 text-xs font-black"
				style={activeTab === tab.key
					? 'background-color: var(--nb-card-bg); color: var(--nb-border); border: 1px solid var(--nb-card-bg);'
					: 'background-color: var(--nb-border); color: var(--nb-card-bg); border: 1px solid var(--nb-border);'}
				>{counts[tab.key]}</span
			>
		</button>
	{/each}
</div>

<Table>
	{#snippet head()}
		<tr>
			<th class="w-10">#</th>
			<th>Nama Lengkap</th>
			<th>Username</th>
			<th>Role</th>
			<th class="text-right">Aksi</th>
		</tr>
	{/snippet}

	{#each paginatedUsers as user, idx (user.id)}
		<tr>
			<td class="font-bold text-(--text-secondary)">{(page - 1) * PAGE_SIZE + idx + 1}</td>
			<td class="font-black text-(--text-primary) whitespace-nowrap">{user.fullname}</td>
			<td class="font-medium text-(--text-secondary) whitespace-nowrap">{user.username}</td>
			<td class="whitespace-nowrap">
				<Badge variant={roleVariant[user.role] ?? 'default'} class="font-black">
					{roleLabels[user.role] ?? user.role}
				</Badge>
			</td>
			<td class="whitespace-nowrap">
				<div class="flex justify-end gap-1">
					<IconButton variant="primary-outline" title="Edit user" onclick={() => (editItem = user)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</IconButton>
						<IconButton
							variant="danger-outline"
							type="button"
							title="Hapus user"
							onclick={(e) => {
								e.preventDefault();
								userToRemove = user;
							}}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</IconButton>
				</div>
			</td>
		</tr>
	{/each}

	{#if paginatedUsers.length === 0}
		<tr>
			<td colspan="5" class="px-5 py-10 text-center font-bold text-(--text-secondary)">
				Belum ada {roleLabels[activeTab]?.toLowerCase()} terdaftar.
			</td>
		</tr>
	{/if}

	{#snippet footer()}
		{#if filteredUsers.length > PAGE_SIZE}
			<div class="card-footer">
				<Pagination bind:page total={filteredUsers.length} pageSize={PAGE_SIZE} />
			</div>
		{/if}
	{/snippet}
</Table>

<!-- Modal Create -->
<Modal show={showCreate} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Tambah User</h2>
	<form method="POST" action="?/create" class="space-y-3" use:enhance={makeEnhance()}>
		<input name="fullname" type="text" class="input-field" placeholder="Nama Lengkap" required />
		<input name="username" type="text" class="input-field" placeholder="Username" required />
		<input
			name="password"
			type="password"
			class="input-field"
			placeholder="Password (min 6 karakter)"
			required
			minlength="6"
		/>
		<select name="role" class="input-field" required>
			<option value="">-- Pilih Role --</option>
			<option value="ADMIN">Admin</option>
			<option value="SUPERVISOR">Pengawas</option>
			<option value="PARTICIPANT">Peserta</option>
		</select>
		<div class="flex justify-end gap-3 pt-2">
			<Button variant="secondary" onclick={closeModals}>Batal</Button>
			<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
		</div>
	</form>
</Modal>

<!-- Modal Import Excel -->
<Modal show={showImport} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-1">Import User dari Excel</h2>
	<div class="flex items-start justify-between mb-4">
		<p class="text-sm font-medium text-(--text-secondary)">
			File Excel harus memiliki kolom:
			<code class="code-inline font-black">fullname</code>,
			<code class="code-inline font-black">username</code>,
			<code class="code-inline font-black">password</code>.
		</p>
		<a
			href="/api/users/template"
			download="template_user.xlsx"
			class="btn-secondary text-xs shrink-0 ml-3"
		>
			Download Template
		</a>
	</div>
	{#if form?.action === 'importExcel' && form?.success && form?.result?.errors?.length}
		<Alert type="info" class="mb-3">
			{form.result.created} user berhasil dibuat. Baris yang gagal:
			<ul class="mt-1 space-y-0.5">
				{#each form.result.errors as err}<li class="text-xs">{err}</li>{/each}
			</ul>
		</Alert>
	{/if}
	<form
		method="POST"
		action="?/importExcel"
		enctype="multipart/form-data"
		class="space-y-3"
		use:enhance={makeEnhance(false)}
	>
		<FormField label="File Excel (.xlsx)">
			<input name="file" type="file" accept=".xlsx" class="input-field" required />
		</FormField>
		<select name="role" class="input-field" required>
			<option value="">-- Pilih Role untuk semua user --</option>
			<option value="ADMIN">Admin</option>
			<option value="SUPERVISOR">Pengawas</option>
			<option value="PARTICIPANT">Peserta</option>
		</select>
		<div class="flex justify-end gap-3 pt-2">
			<Button variant="secondary" onclick={closeModals}>Tutup</Button>
			<Button type="submit" loading={submitting}>{submitting ? 'Mengimport...' : 'Import'}</Button>
		</div>
	</form>
</Modal>

<!-- Modal Edit -->
<Modal show={!!editItem} onClose={closeModals}>
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Edit User</h2>
	{#if editItem}
		<form method="POST" action="?/update" class="space-y-3" use:enhance={makeEnhance()}>
			<input type="hidden" name="id" value={editItem.id} />
			<input
				name="fullname"
				type="text"
				class="input-field"
				placeholder="Nama Lengkap"
				value={editItem.fullname}
				required
			/>
			<input
				name="username"
				type="text"
				class="input-field"
				placeholder="Username"
				value={editItem.username}
				required
			/>
			<input
				name="password"
				type="password"
				class="input-field"
				placeholder="Password baru (kosongkan jika tidak diubah)"
			/>
			<select name="role" class="input-field" required>
				<option value="ADMIN" selected={editItem.role === 'ADMIN'}>Admin</option>
				<option value="SUPERVISOR" selected={editItem.role === 'SUPERVISOR'}>Pengawas</option>
				<option value="PARTICIPANT" selected={editItem.role === 'PARTICIPANT'}>Peserta</option>
			</select>
			<div class="flex justify-end gap-3 pt-2">
				<Button variant="secondary" onclick={closeModals}>Batal</Button>
				<Button type="submit" loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
			</div>
		</form>
	{/if}
</Modal>

<form bind:this={removeForm} method="POST" action="?/delete" use:enhance={makeEnhance(false)}>
	<input type="hidden" name="id" value={userToRemove?.id ?? ''} />
</form>

<ConfirmModal
	show={!!userToRemove}
	title="Konfirmasi Hapus"
	message={`Hapus user ${userToRemove?.fullname ?? ''}?`}
	onCancel={() => (userToRemove = null)}
	onConfirm={() => {
		removeForm.requestSubmit();
		userToRemove = null;
	}}
/>
