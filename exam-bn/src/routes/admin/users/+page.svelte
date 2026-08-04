<script lang="ts">
	import Pagination from '$lib/components/Pagination.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import { getInitials, resolvePictureUrl } from '$lib/utils/avatar';
	import type { PageData } from './$types';
	import type { User } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'student' | 'teacher' | 'super_admin'>('student');
	let page = $state(1);

	const roleLabels: Record<string, string> = {
		super_admin: 'Admin',
		teacher: 'Pengawas',
		student: 'Peserta'
	};

	const PAGE_SIZE = 10;
	const filteredUsers = $derived(data.users.filter((u: User) => u.role === activeTab));
	const paginatedUsers = $derived(filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
	$effect(() => {
		activeTab;
		page = 1;
	});

	const counts = $derived({
		student: data.users.filter((u: User) => u.role === 'student').length,
		teacher: data.users.filter((u: User) => u.role === 'teacher').length,
		super_admin: data.users.filter((u: User) => u.role === 'super_admin').length
	});

	const tabs: Array<{ key: 'student' | 'teacher' | 'super_admin'; label: string }> = [
		{ key: 'student', label: 'Peserta' },
		{ key: 'teacher', label: 'Pengawas' },
		{ key: 'super_admin', label: 'Admin' }
	];
</script>

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
	<div>
		<h1 class="text-2xl font-black text-(--text-primary)">Daftar User</h1>
		<p class="text-sm font-medium text-(--text-secondary) mt-1">
			Data user disinkronkan dari master. Pengelolaan akun (buat/ubah/hapus) dilakukan di aplikasi
			master/portal.
		</p>
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
			<th class="w-14">Foto</th>
			<th>Nama Lengkap</th>
			<th>Email</th>
		</tr>
	{/snippet}

	{#each paginatedUsers as user, idx (user.id)}
		{@const name = user.fullname?.trim() || (user.role === 'super_admin' ? 'Super Admin' : 'Super Admin')}
		{@const initial = getInitials(name)}
		{@const picUrl = resolvePictureUrl(user.pictureUrl)}
		<tr>
			<td class="font-bold text-(--text-secondary)">{(page - 1) * PAGE_SIZE + idx + 1}</td>
			<td>
				{#if picUrl}
					<img
						src={picUrl}
						alt={name}
						class="w-8 h-8 rounded-full object-cover border border-(--nb-border)"
					/>
				{:else}
					<div
						class="avatar-pill w-8 h-8 flex items-center justify-center font-black text-xs text-white"
					>
						{initial}
					</div>
				{/if}
			</td>

			<td class="font-black text-(--text-primary) whitespace-nowrap">
				{name}
			</td>
			<td class="font-medium text-(--text-secondary) whitespace-nowrap">
				{user.email || '—'}
			</td>
		</tr>
	{/each}

	{#if paginatedUsers.length === 0}
		<tr>
			<td colspan="4" class="px-5 py-10 text-center font-bold text-(--text-secondary)">
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

