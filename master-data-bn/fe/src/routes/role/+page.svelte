<script lang="ts">
    import { PageHeader, Modal, Toast, SearchBar, Pagination } from '$lib/components/molecules';
    import { Button, Checkbox, Badge, Icon } from '$lib/components/atoms';
    import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '$lib/components/organisms/table';
    import { apiClient } from '$lib/utils/api';
    import { toast } from '$lib/stores/toast.svelte';

    const AVAILABLE_ROLES = [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'exam_admin', label: 'Exam Admin' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'student', label: 'Student' },
        { value: 'industry_mentor', label: 'Industry Mentor' }
    ];

    const getIconForType = (type: string) => {
        const t = type.toLowerCase();
        if (t === 'email') return 'mail';
        if (t === 'phone') return 'phone';
        if (t === 'nik') return 'person';
        if (t === 'nis' || t === 'nisn') return 'school';
        if (t === 'nip') return 'work';
        return 'label';
    };

    const getThemeForType = (type: string) => {
        const t = type.toLowerCase();
        if (t === 'email') return { bg: 'bg-rose-400' };
        if (t === 'phone') return { bg: 'bg-emerald-400' };
        if (t === 'nik') return { bg: 'bg-fuchsia-400' };
        if (t === 'nis' || t === 'nisn') return { bg: 'bg-cyan-400' };
        if (t === 'nip') return { bg: 'bg-amber-400' };
        return { bg: 'bg-gray-400' };
    };

    let users = $state<import('$lib/types').User[]>([]);
    let isLoading = $state(true);
    let currentPage = $state(1);
    let limit = $state(10);
    let totalPages = $state(1);
    let totalItems = $state(0);
    let searchQuery = $state('');

    const fetchUsers = async (page: number, limitPerPage: number, search: string) => {
        isLoading = true;
        try {
            const res = await apiClient(`/users?page=${page}&limit=${limitPerPage}&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const result = await res.json();
                users = result.data || [];
                totalPages = result.pagination?.totalPage || 1;
                totalItems = result.pagination?.totalData || 0;
            } else {
                toast.error('Gagal memuat data pengguna');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            isLoading = false;
        }
    };

    // Debounce search
    let searchTimeout: ReturnType<typeof setTimeout>;
    $effect(() => {
        clearTimeout(searchTimeout);
        const search = searchQuery; // capture in closure
        const page = currentPage;
        const lim = limit;
        searchTimeout = setTimeout(() => {
            fetchUsers(page, lim, search);
        }, 300);
    });

    let modalOpen = $state(false);
    let pendingRoleChange = $state<{ userId: string; role: string; action: 'add' | 'remove' } | null>(null);
    let isSubmitting = $state(false);

    const handleRoleToggle = (e: Event, userId: string, role: string) => {
        e.preventDefault();
        const user = users.find((u: import('$lib/types').User) => u.id === userId);
        const hasRole = user?.roles?.includes(role) || false;

        pendingRoleChange = {
            userId,
            role,
            action: hasRole ? 'remove' : 'add'
        };
        modalOpen = true;
    };

    const confirmRoleChange = async () => {
        if (!pendingRoleChange) return;

        isSubmitting = true;
        const { userId, role, action } = pendingRoleChange;

        const userIndex = users.findIndex((u: import('$lib/types').User) => u.id === userId);
        const user = users[userIndex];

        let newRoles = [...user.roles];
        if (action === 'add') {
            newRoles.push(role);
        } else {
            newRoles = newRoles.filter(r => r !== role);
        }

        try {
            const res = await apiClient(`/users/${userId}/roles`, {
                method: 'PATCH',
                body: JSON.stringify({ roles: newRoles })
            });

            if (res.ok) {
                const result = await res.json();
                users[userIndex] = { ...users[userIndex], roles: result.data.roles };
                toast.success(`Berhasil mengubah peran pengguna.`);
            } else {
                toast.error('Gagal memperbarui peran pengguna.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan pada server.');
        } finally {
            isSubmitting = false;
            modalOpen = false;
            pendingRoleChange = null;
        }
    };
    let selectedIds = $state<string[]>([]);
    let isBulkRoleOpen = $state(false);
    let bulkSelectedRoles = $state<string[]>([]);
    let bulkAction = $state<'add' | 'remove'>('add');

    function toggleAll(e: Event) {
        const checked = (e.target as HTMLInputElement).checked;
        selectedIds = checked ? users.map(u => u.id) : [];
    }

    const handleBulkRoleChange = async () => {
        isSubmitting = true;
        try {
            const res = await apiClient('/users/bulk/roles', {
                method: 'PATCH',
                body: JSON.stringify({ userIds: selectedIds, roles: bulkSelectedRoles, action: bulkAction })
            });

            if (res.ok) {
                toast.success(`${selectedIds.length} pengguna berhasil diperbarui perannya.`);
                isBulkRoleOpen = false;
                selectedIds = [];
                bulkSelectedRoles = [];
                fetchUsers(currentPage, limit, searchQuery);
            } else {
                toast.error('Gagal memperbarui peran masal.');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan pada server.');
        } finally {
            isSubmitting = false;
        }
    };
</script>

<div class="flex h-full flex-col gap-md">
    <PageHeader title="Manajemen Peran" description="Kelola hak akses dan peran pengguna sistem" />

    <div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
        <div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
            <SearchBar bind:value={searchQuery} placeholder="Cari berdasarkan ID, email, nisn, dll..." class="w-full md:w-96 h-10" />
        </div>
    </div>

    {#if selectedIds.length > 0}
        <div class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm">
            <span class="font-body-bold text-body-bold">{selectedIds.length} Pengguna dipilih</span>
            <div class="flex gap-2">
                <Button variant="error" class="!w-48 !h-12" onclick={() => { bulkAction = 'remove'; isBulkRoleOpen = true; }}>Hapus Peran Masal</Button>
                <Button variant="info" class="!w-48 !h-12" onclick={() => { bulkAction = 'add'; isBulkRoleOpen = true; }}>Tambah Peran Masal</Button>
            </div>
        </div>
    {/if}

    <Table class="mb-0">
        <TableHead>
            <TableRow header>
                <TableHeadCell width="w-12" align="center">
                    <Checkbox checked={selectedIds.length === users.length && users.length > 0} onchange={toggleAll} />
                </TableHeadCell>
                <TableHeadCell width="w-72">ID Pengguna</TableHeadCell>
                <TableHeadCell>Identifier</TableHeadCell>
                <TableHeadCell width="w-64">Peran</TableHeadCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {#each users as user, i}
                <TableRow striped={i % 2 !== 0}>
                    <TableCell align="center">
                        <Checkbox bind:group={selectedIds} value={user.id} />
                    </TableCell>
                    <TableCell class="font-mono text-sm align-top">
                        {user.id}
                    </TableCell>
                    <TableCell class="align-top">
                        <div class="flex flex-wrap gap-2">
                            {#if user.sentri_identifiers}
                                {#each user.sentri_identifiers as identifier}
                                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-on-background {getThemeForType(identifier.type).bg} transition-colors">
                                        <Icon name={getIconForType(identifier.type)} class="text-xl text-on-background" fill={0} />
                                        <span class="font-body-bold text-on-background text-sm">{identifier.value}</span>
                                        <span class="text-[10px] uppercase bg-white px-1.5 py-0.5 rounded font-black text-on-background border-2 border-on-background">{identifier.type}</span>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                    </TableCell>
                    <TableCell class="align-top">
                        <div class="flex flex-col gap-3">
                            {#each AVAILABLE_ROLES as role}
                                <button type="button" class="flex items-center gap-3 cursor-pointer group bg-transparent border-none p-0 text-left w-full" onclick={(e) => {
                                    e.preventDefault();
                                    handleRoleToggle(e, user.id, role.value);
                                }}>
                                    <Checkbox 
                                        checked={user.roles.includes(role.value)} 
                                        tabindex="-1"
                                    />
                                    <span class="font-medium text-on-surface group-hover:text-primary transition-colors">
                                        {role.label}
                                    </span>
                                </button>
                            {/each}
                        </div>
                    </TableCell>
                </TableRow>
            {/each}
            {#if isLoading}
                <TableRow>
                    <TableCell colspan={4} align="center" class="py-xl">
                        <span class="font-body-base text-on-surface-variant">Memuat data pengguna...</span>
                    </TableCell>
                </TableRow>
            {:else if users.length === 0}
                <TableRow>
                    <TableCell colspan={4} align="center" class="py-xl">
                        <span class="font-body-base text-on-surface-variant">Tidak ada data pengguna.</span>
                    </TableCell>
                </TableRow>
            {/if}
        </TableBody>
    </Table>

    <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={limit}
        onPageChange={(page) => currentPage = page}
    />
</div>

<Modal bind:isOpen={modalOpen} title="Konfirmasi Perubahan Role">
    {#if pendingRoleChange}
        <div class="py-4 text-on-surface text-lg">
            Apakah Anda yakin ingin <strong>{pendingRoleChange.action === 'add' ? 'menambahkan' : 'menghapus'}</strong> role <span class="font-bold text-primary">{AVAILABLE_ROLES.find(r => r.value === pendingRoleChange?.role)?.label}</span> untuk user ini?
        </div>
    {/if}

    {#snippet footer()}
        <Button variant="secondary" onclick={() => modalOpen = false} disabled={isSubmitting} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">
            Batal
        </Button>
        <Button variant="info" onclick={confirmRoleChange} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Ya, Lanjutkan'}
        </Button>
    {/snippet}
</Modal>

<Modal bind:isOpen={isBulkRoleOpen} title={bulkAction === 'add' ? 'Tambah Peran Masal' : 'Hapus Peran Masal'}>
    <div class="flex flex-col gap-sm">
        <p class="font-body-base text-body-base text-on-surface-variant">
            Pilih peran yang akan <strong>{bulkAction === 'add' ? 'ditambahkan ke' : 'dihapus dari'}</strong> <strong>{selectedIds.length}</strong> pengguna yang dipilih. Peran lain yang sudah ada pada pengguna tidak akan terpengaruh.
        </p>
        <div class="flex flex-col gap-3 mt-4">
            {#each AVAILABLE_ROLES as role}
                <label class="flex items-center gap-3 cursor-pointer group">
                    <Checkbox bind:group={bulkSelectedRoles} value={role.value} />
                    <span class="font-medium text-on-surface group-hover:text-primary transition-colors">
                        {role.label}
                    </span>
                </label>
            {/each}
        </div>
    </div>
    {#snippet footer()}
        <Button variant="secondary" onclick={() => isBulkRoleOpen = false} disabled={isSubmitting} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">
            Batal
        </Button>
        <Button variant={bulkAction === 'add' ? 'info' : 'error'} onclick={handleBulkRoleChange} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
    {/snippet}
</Modal>
