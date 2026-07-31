<script lang="ts">
  import Checkbox from '$lib/components/atoms/Checkbox.svelte';
  import Input from '$lib/components/atoms/Input.svelte';
  import Button from '$lib/components/atoms/Button.svelte';
  import ActionButton from '$lib/components/atoms/ActionButton.svelte';

  import { goto } from '$app/navigation';
  import { env as publicEnv } from '$env/dynamic/public';
  import { toast } from '$lib/stores/toast';

  const getApiUrl = (): string => {
    return publicEnv.PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  };

  export type Role = { id: string; name: string; description?: string };
  export type User = { id: string; email: string; roles: string[]; status: string; createdAt: string; };
  export type Pagination = { currentPage: number; totalPage: number; totalData: number; dataPerPage: number; };

  let { users: initialUsers, roles, pagination }: { users: User[]; roles: Role[]; pagination?: Pagination } = $props();
  
  // State
  let users = $state(initialUsers);
  let searchQuery = $state('');
  let selectedIds = $state<string[]>([]);
  let searchTimeout: ReturnType<typeof setTimeout>;

  // Editing state for single user modal
  let editingUser = $state<User | null>(null);

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
      currentRoles = currentRoles.filter(r => r !== roleId);
    } else {
      currentRoles.push(roleId);
    }
    editingUser.roles = currentRoles;
  }

  async function saveSingleUserRoles() {
    if (!editingUser) return;
    const targetUser = editingUser;
    editingUser = null; // Close modal

    const index = users.findIndex(u => u.id === targetUser.id);
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
      toast.success(`Role pengguna ${targetUser.email} berhasil diperbarui`, 'Berhasil Assign Role');
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
    const selectedUsers = users.filter(u => selectedIds.includes(u.id));
    return selectedUsers.every(u => (u.roles || []).includes(roleId));
  }

  async function toggleBulkRole(roleId: string) {
    const isAssignedToAll = isRoleAssignedToAllSelected(roleId);
    
    // Calculate final states for API
    let allUserUpdates = users.map(user => {
      if (!selectedIds.includes(user.id)) return user;
      
      let newRoles = user.roles ? [...user.roles] : [];
      if (isAssignedToAll) {
        newRoles = newRoles.filter(id => id !== roleId);
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
      await Promise.all(selectedIds.map(async id => {
        const u = allUserUpdates.find(user => user.id === id);
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
      }));
      toast.success(`Role berhasil diperbarui untuk ${selectedIds.length} pengguna`, 'Bulk Assign Role');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal memperbarui hak akses pengguna secara massal';
      console.error(e);
      users = previousUsers;
      toast.error(message, 'Gagal Bulk Assign Role');
    }
  }

  function toggleUserSelection(userId: string) {
    if (selectedIds.includes(userId)) {
      selectedIds = selectedIds.filter(id => id !== userId);
    } else {
      selectedIds = [...selectedIds, userId];
    }
  }

  function toggleSelectAll() {
    if (isAllSelected) {
      const userIds = users.map(u => u.id);
      selectedIds = selectedIds.filter(id => !userIds.includes(id));
    } else {
      const userIds = users.map(u => u.id);
      selectedIds = [...new Set([...selectedIds, ...userIds])];
    }
  }

  let isAllSelected = $derived(
    users.length > 0 && users.every(u => selectedIds.includes(u.id))
  );

  let isBulkModalOpen = $state(false);

  function getRoleName(roleId: string) {
    const r = roles.find(item => item.id === roleId);
    return r ? r.name : roleId;
  }
</script>

<div class="bg-surface rounded-xl neo-border neo-shadow p-1 overflow-hidden space-y-4 flex flex-col h-full relative">
  
  <!-- Header / Toolbar -->
  <div class="flex flex-col p-4 border-b-4 border-black bg-primary-fixed gap-4">
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
      <div class="flex items-center justify-end w-full gap-4">
        <Button 
          variant="primary" 
          className="!w-auto !py-2 !px-4 !bg-tertiary-container text-sm"
          onclick={() => isBulkModalOpen = true}
        >
          Atur Role Massal ({selectedIds.length})
        </Button>
      </div>
    {/if}
  </div>

  <!-- Table -->
  <div class="overflow-x-auto bg-surface-container-lowest flex-grow">
    <table class="min-w-full text-left text-sm text-on-surface">
      <thead class="bg-surface-variant border-b-4 border-black text-on-surface font-label-bold">
        <tr>
          <th class="px-4 py-4 border-r-2 border-black w-12 text-center">
            <Checkbox 
              checked={isAllSelected}
              onchange={(e) => {
                e.preventDefault();
                toggleSelectAll();
              }}
            />
          </th>
          <th class="px-6 py-4 border-r-2 border-black">Email</th>
          <th class="px-6 py-4 border-r-2 border-black">Roles saat ini</th>
          <th class="px-6 py-4 text-center w-36">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#each users as user (user.id)}
          <tr class="border-b-4 border-black hover:bg-surface-container-low transition-colors {selectedIds.includes(user.id) ? 'bg-primary-fixed-dim/20' : ''}">
            <td class="px-4 py-4 border-r-2 border-black text-center">
              <Checkbox 
                checked={selectedIds.includes(user.id)}
                onchange={(e) => {
                  e.preventDefault();
                  toggleUserSelection(user.id);
                }}
              />
            </td>
            <td class="px-6 py-4 border-r-2 border-black font-headline-md">{user.email || user.id}</td>
            <td class="px-6 py-4 border-r-2 border-black">
              <div class="flex flex-wrap gap-2">
                {#if (user.roles || []).length > 0}
                  {#each user.roles as roleId (roleId)}
                    <span class="inline-block px-2.5 py-1 text-xs font-label-bold bg-secondary-container text-on-secondary-container border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
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
            <td colspan="4" class="px-6 py-8 text-center font-body-md text-on-surface-variant">Tidak ada data pengguna yang sesuai.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="flex justify-between items-center p-4 border-t-4 border-black bg-surface-variant">
    <span class="font-label-bold text-sm text-on-surface">
      Halaman {pagination?.currentPage ?? 1} dari {pagination?.totalPage ?? 1} (Total Data: {pagination?.totalData ?? users.length})
    </span>
    <div class="flex gap-2">
      <Button 
        variant="secondary" 
        className="!w-auto !py-1.5 !px-3"
        disabled={(pagination?.currentPage ?? 1) <= 1}
        onclick={() => goToPage((pagination?.currentPage ?? 1) - 1)}
      >
        Prev
      </Button>

      {#each Array(pagination?.totalPage ?? 1) as _page, i (i)}
        {@const pageNum = i + 1}
        <Button 
          variant={(pagination?.currentPage ?? 1) === pageNum ? 'primary' : 'secondary'}
          className="!w-auto !py-1.5 !px-3 {(pagination?.currentPage ?? 1) === pageNum ? '!bg-primary-container text-white' : ''}"
          onclick={() => goToPage(pageNum)}
        >
          {pageNum}
        </Button>
      {/each}

      <Button 
        variant="secondary" 
        className="!w-auto !py-1.5 !px-3"
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
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-surface rounded-2xl neo-border neo-shadow-lg p-6 max-w-md w-full relative">
      <button 
        class="absolute -top-4 -right-4 w-10 h-10 bg-error text-white neo-border rounded-full flex items-center justify-center neo-shadow-sm hover:-translate-y-1 hover:neo-shadow-lg transition-all"
        onclick={() => editingUser = null}
        aria-label="Tutup Modal"
      >
        <span class="material-symbols-outlined font-bold text-xl">close</span>
      </button>

      <h3 class="font-headline-lg text-2xl mb-1 text-on-surface">Atur Role Pengguna</h3>
      <p class="font-body-md text-sm text-on-surface-variant mb-6 pb-4 border-b-2 border-black">
        Pengguna: <span class="font-bold text-primary">{editingUser.email || editingUser.id}</span>
      </p>

      <div class="flex flex-col gap-3 mb-8">
        {#each roles as role (role.id)}
          <div class="p-3 bg-surface-container-lowest neo-border rounded-lg flex justify-between items-center hover:bg-surface-container-low transition-colors">
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

      <div class="flex gap-3 justify-end">
        <Button variant="secondary" className="!w-auto !py-2 !px-4" onclick={() => editingUser = null}>Batal</Button>
        <Button variant="primary" className="!w-auto !py-2 !px-4" onclick={saveSingleUserRoles}>Simpan</Button>
      </div>
    </div>
  </div>
{/if}

<!-- Bulk Roles Modal -->
{#if isBulkModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-surface rounded-2xl neo-border neo-shadow-lg p-6 max-w-md w-full relative">
      <button 
        class="absolute -top-4 -right-4 w-10 h-10 bg-error text-white neo-border rounded-full flex items-center justify-center neo-shadow-sm hover:-translate-y-1 hover:neo-shadow-lg transition-all"
        onclick={() => isBulkModalOpen = false}
        aria-label="Tutup Modal"
      >
        <span class="material-symbols-outlined font-bold text-xl">close</span>
      </button>

      <h3 class="font-headline-lg text-2xl mb-2 text-on-surface">Atur Role Massal</h3>
      <p class="font-body-md text-on-surface-variant mb-6 pb-4 border-b-2 border-black">
        Pilih role yang ingin ditetapkan untuk <span class="font-bold text-primary">{selectedIds.length} pengguna terpilih</span>.
      </p>

      <div class="flex flex-col gap-4 mb-8">
        {#each roles as role (role.id)}
          <div class="p-3 bg-surface-container-lowest neo-border rounded-lg flex justify-between items-center hover:bg-surface-container-low transition-colors">
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

      <Button variant="primary" onclick={() => isBulkModalOpen = false}>
        Selesai
      </Button>
    </div>
  </div>
{/if}
