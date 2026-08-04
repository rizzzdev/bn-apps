<script lang="ts">
  import {
    Pagination,
    Modal,
    FormField,
    ConfirmationModal,
    SearchFilter,
    Table,
    Th,
    Td,
    Tr,
    Select,
  } from "$lib/components/molecules";
  import { Icon, Button, ActionButton, Checkbox } from "$lib/components/atoms";
  import { apiClient, getAccessToken, getApiBaseUrl } from "$lib/utils/api";
  import { toast } from "$lib/stores/toast.svelte";
  import { PUBLIC_API_URL } from "$env/static/public";
  import { read, utils } from "xlsx";
  import { untrack } from "svelte";
  import { formatFullName } from "$lib/utils/helpers";

  let activeTab = $state<"student" | "teacher" | "mentor">("student");

  let currentPage = $state(1);
  let totalPages = $state(1);
  let loading = $state(true);
  let users = $state<any[]>([]);

  let showDeleteConfirm = $state(false);
  let selectedIdToDelete = $state("");

  // --- Mentor Specific State ---
  let showImportModal = $state(false);
  let importFile = $state<File | null>(null);
  let isImporting = $state(false);
  let fileInput = $state<HTMLInputElement>();

  let showFormModal = $state(false);
  let formMode = $state<"create" | "edit">("create");
  let isSubmitting = $state(false);

  let formId = $state("");
  let formName = $state("");
  let formEmail = $state("");
  let formPassword = $state("");
  let formPhone = $state("");
  let formPosition = $state("");
  let formCompanyId = $state("");
  let formPrefixTitle = $state("");
  let formSuffixTitle = $state("");

  let selectedMentors = $state<string[]>([]);
  let showBulkCompanyModal = $state(false);
  let bulkCompanyId = $state("");
  let showBulkDeleteConfirm = $state(false);

  let previewData = $state<any[]>([]);

  let companies = $state<any[]>([]);
  let searchQuery = $state("");

  async function fetchUsers(tab: string, page: number) {
    loading = true;
    let endpoint = "";
    if (tab === "student")
      endpoint = "/api/v1/master/students?includeCurrentClass=true";
    else if (tab === "teacher") endpoint = "/api/v1/master/teachers";
    else if (tab === "mentor") endpoint = "/industry-mentors";

    const currentSearch = untrack(() => searchQuery);
    const searchParam = currentSearch
      ? `&search=${encodeURIComponent(currentSearch)}`
      : "";
    const sep = endpoint.includes("?") ? "&" : "?";
    const res = await apiClient(
      `${endpoint}${sep}page=${page}&limit=10${searchParam}`,
    );
    if (res && !res.error) {
      users = res.data || [];
      if (res.pagination) {
        totalPages = res.pagination.totalPage || 1;
        currentPage = res.pagination.currentPage || 1;
      }
    } else {
      users = [];
      totalPages = 1;
    }
    loading = false;
  }

  async function fetchCompanies() {
    const res = await apiClient(`/companies?limit=100`);
    if (res && !res.error) companies = res.data || [];
  }

  function confirmDelete(id: string) {
    selectedIdToDelete = id;
    showDeleteConfirm = true;
  }

  async function handleDelete() {
    showDeleteConfirm = false;
    let baseEndpoint = "";
    if (activeTab === "student") baseEndpoint = "/api/v1/master/students";
    else if (activeTab === "teacher") baseEndpoint = "/api/v1/master/teachers";
    else if (activeTab === "mentor") baseEndpoint = "/industry-mentors";

    const res = await apiClient(`${baseEndpoint}/${selectedIdToDelete}`, {
      method: "DELETE",
    });
    if (res && !res.error) {
      toast.success("Pengguna berhasil dihapus!");
      fetchUsers(activeTab, currentPage);
    } else {
      toast.error("Gagal menghapus pengguna");
    }
  }

  // --- Mentor Actions ---
  function openMentorCreateModal() {
    formMode = "create";
    formId = "";
    formName = "";
    formEmail = "";
    formPassword = "";
    formPhone = "";
    formPosition = "";
    formCompanyId = "";
    formPrefixTitle = "";
    formSuffixTitle = "";
    if (companies.length === 0) fetchCompanies();
    showFormModal = true;
  }

  function openMentorEditModal(mentor: any) {
    formMode = "edit";
    formId = mentor.id;
    formName = mentor.name || "";
    formEmail = mentor.email || "";
    formPassword = "";
    formPhone = mentor.phone || "";
    formPosition = mentor.position || "";
    formCompanyId = mentor.companyId || "";
    formPrefixTitle = mentor.prefixTitle || "";
    formSuffixTitle = mentor.suffixTitle || "";
    if (companies.length === 0) fetchCompanies();
    showFormModal = true;
  }

  async function handleMentorSave() {
    if (!formName || !formEmail) {
      toast.error("Nama dan Email wajib diisi!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      toast.error("Format email tidak valid!");
      return;
    }

    if (formMode === "create") {
      if (!formPassword) {
        toast.error("Password wajib diisi!");
        return;
      }
      if (formPassword.length < 8) {
        toast.error("Password minimal 8 karakter!");
        return;
      }
    } else if (formMode === "edit" && formPassword) {
      if (formPassword.length < 8) {
        toast.error("Password baru minimal 8 karakter!");
        return;
      }
    }

    isSubmitting = true;
    const payload: any = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      position: formPosition,
      companyId: formCompanyId || undefined,
      prefixTitle: formPrefixTitle || undefined,
      suffixTitle: formSuffixTitle || undefined,
    };

    if (formMode === "create" && formPassword) {
      payload.password = formPassword;
    }

    let endpoint = "/industry-mentors";
    let method = "POST";

    if (formMode === "edit") {
      endpoint = `/industry-mentors/${formId}`;
      method = "PUT";
    }

    const res = await apiClient(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    if (res && !res.error && formMode === "edit" && formPassword) {
      const resetRes = await apiClient(`/industry-mentors/${formId}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword: formPassword }),
      });
      if (resetRes?.error) {
        toast.error(
          resetRes.message ||
            "Profil diperbarui, namun gagal mereset password!",
        );
      }
    }

    isSubmitting = false;

    if (res && !res.error) {
      toast.success(
        formMode === "create"
          ? "Mentor berhasil ditambahkan!"
          : "Mentor berhasil diperbarui!",
      );
      showFormModal = false;
      fetchUsers(activeTab, currentPage);
    } else {
      toast.error(res?.message || "Gagal menyimpan data mentor");
    }
  }

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      importFile = target.files[0];

      try {
        const data = await importFile.arrayBuffer();
        const workbook = read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = utils.sheet_to_json(sheet);

        previewData = rows
          .map((row) => ({
            name: (row["Nama Mentor"] || row["Nama Lengkap"])?.toString().trim() || "",
            email: row["Email"]?.toString().trim() || "",
            password: row["Password"]?.toString() || "password123",
            position: (row["Jabatan"] || row["Posisi di Perusahaan"])?.toString() || null,
            phone: (row["Nomor Telepon"] || row["No. HP"])?.toString() || null,
            prefixTitle: row["Gelar Depan"]?.toString().trim() || null,
            suffixTitle: row["Gelar Belakang"]?.toString().trim() || null,
          }))
          .filter((row) => row.name && row.email);

        if (previewData.length === 0) {
          toast.error("Format tidak sesuai atau data kosong");
          importFile = null;
        }
      } catch (err) {
        toast.error("Gagal membaca file excel");
        importFile = null;
      }
    }
  }

  async function handleImport() {
    if (previewData.length === 0) {
      toast.error("Tidak ada data untuk diimpor");
      return;
    }

    isImporting = true;

    const res = await apiClient("/industry-mentors/batch", {
      method: "POST",
      body: JSON.stringify(previewData),
    });

    isImporting = false;
    if (res && !res.error) {
      toast.success(res.message || "Berhasil mengimpor mentor");
      showImportModal = false;
      importFile = null;
      previewData = [];
      fetchUsers(activeTab, currentPage);
    } else {
      toast.error(res?.message || "Gagal mengimpor mentor");
    }
  }

  async function handleBulkEditCompany() {
    if (!bulkCompanyId) {
      toast.error("Pilih perusahaan terlebih dahulu!");
      return;
    }
    const res = await apiClient("/industry-mentors/batch/company", {
      method: "PATCH",
      body: JSON.stringify({ ids: selectedMentors, companyId: bulkCompanyId }),
    });

    if (res && !res.error) {
      toast.success(res.message || "Berhasil memperbarui perusahaan mentor");
      showBulkCompanyModal = false;
      selectedMentors = [];
      fetchUsers(activeTab, currentPage);
    } else {
      toast.error(res?.message || "Gagal memperbarui perusahaan mentor");
    }
  }

  async function handleBulkDeleteMentors() {
    showBulkDeleteConfirm = false;
    const res = await apiClient("/industry-mentors/batch/delete", {
      method: "POST",
      body: JSON.stringify({ ids: selectedMentors }),
    });
    if (res && !res.error) {
      toast.success(res.message || `Berhasil menghapus ${selectedMentors.length} mentor`);
      selectedMentors = [];
      fetchUsers(activeTab, currentPage);
    } else {
      toast.error(res?.message || "Gagal menghapus mentor");
    }
  }

  function handleSelectAll(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      selectedMentors = users.map((u) => u.id);
    } else {
      selectedMentors = [];
    }
  }

  function toggleSelection(id: string) {
    if (selectedMentors.includes(id)) {
      selectedMentors = selectedMentors.filter((i) => i !== id);
    } else {
      selectedMentors = [...selectedMentors, id];
    }
  }

  async function downloadTemplate() {
    try {
      const accessToken = getAccessToken() ?? "";

      const res = await fetch(
        `${getApiBaseUrl()}/internship/industry-mentors/template`,
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        },
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template-mentor.xlsx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        toast.error("Gagal mendownload template mentor");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan saat mendownload template");
    }
  }

  $effect(() => {
    fetchUsers(activeTab, currentPage);
  });
</script>

<svelte:head>
  <title>Data Pengguna | Magang-BN</title>
</svelte:head>

<div
  class="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-4 animate-fade-in-up"
>
  <div>
    <h2 class="font-headline text-xl font-black uppercase tracking-tight">
      Data Pengguna
    </h2>
    <p class="font-mono text-secondary text-[10px] mt-1">
      Kelola akun Murid, Guru, dan Mentor.
    </p>
  </div>
  <div class="flex flex-wrap gap-1">
    {#if activeTab === "mentor"}
      <Button variant="success" onclick={() => (showImportModal = true)}>
        <Icon name="upload_file" />
        <span>Import Mentor</span>
      </Button>
      <Button variant="warning" onclick={openMentorCreateModal}>
        <Icon name="person_add" />
        <span>Tambah Mentor</span>
      </Button>
    {/if}
  </div>
</div>

<div
  class="mb-4 flex gap-2 animate-fade-in-up"
  style="animation-delay: 0.1s; animation-fill-mode: both;"
>
  {#if activeTab === "mentor" && selectedMentors.length > 0}
    <Button variant="error" size="sm" onclick={() => (showBulkDeleteConfirm = true)}>
      Hapus Terpilih ({selectedMentors.length})
    </Button>
    <Button
      variant="primary"
      size="sm"
      onclick={() => {
        if (companies.length === 0) fetchCompanies();
        showBulkCompanyModal = true;
      }}
    >
      Set Perusahaan ({selectedMentors.length})
    </Button>
  {/if}
</div>

<div
  class="animate-fade-in-up"
  style="animation-delay: 0.1s; animation-fill-mode: both;"
>
  <SearchFilter
    bind:searchQuery
    onSearch={() => {
      currentPage = 1;
      fetchUsers(activeTab, 1);
    }}
    placeholder={`Cari ${activeTab}...`}
  />
</div>

<div
  class="mb-3 flex border-b-2 border-on-background animate-fade-in-up"
  style="animation-delay: 0.1s; animation-fill-mode: both;"
>
  <button
    class="px-4 py-2 font-headline font-black uppercase text-[10px] border-r-2 border-t-2 border-l-2 border-on-background transition-all {activeTab ===
    'student'
      ? 'bg-primary text-on-background -mb-[2px]'
      : 'bg-slate-200 border-transparent text-secondary'}"
    onclick={() => {
      activeTab = "student";
      currentPage = 1;
    }}
  >
    Murid
  </button>
  <button
    class="px-4 py-2 font-headline font-black uppercase text-[10px] border-r-2 border-t-2 border-on-background transition-all {activeTab ===
    'teacher'
      ? 'bg-primary text-on-background -mb-[2px] border-l-2'
      : 'bg-slate-200 border-transparent text-secondary'}"
    onclick={() => {
      activeTab = "teacher";
      currentPage = 1;
    }}
  >
    Guru
  </button>
  <button
    class="px-4 py-2 font-headline font-black uppercase text-[10px] border-r-2 border-t-2 border-on-background transition-all {activeTab ===
    'mentor'
      ? 'bg-primary text-on-background -mb-[2px] border-l-2'
      : 'bg-slate-200 border-transparent text-secondary'}"
    onclick={() => {
      activeTab = "mentor";
      currentPage = 1;
    }}
  >
    Mentor
  </button>
</div>

<Table
  {loading}
  empty={users.length === 0}
  colSpan={6}
  emptyMessage={`Tidak ada data ${activeTab}.`}
>
  {#snippet header()}
    {#if activeTab === "student"}
      <Th>Nama Lengkap</Th>
      <Th>Email</Th>
      <Th>NISN</Th>
      <Th>Jurusan</Th>
      <Th bordered={false}>Kelas</Th>
    {:else if activeTab === "teacher"}
      <Th>Nama Lengkap (Gelar)</Th>
      <Th>Email</Th>
      <Th bordered={false}>NIP</Th>
    {:else if activeTab === "mentor"}
      <Th variant="checkbox">
        <Checkbox
          onchange={handleSelectAll}
          checked={selectedMentors.length === users.length && users.length > 0}
        />
      </Th>
      <Th>Nama Mentor (Gelar)</Th>
      <Th>Email</Th>
      <Th>Perusahaan & Posisi</Th>
      <Th>Telepon</Th>
      <Th variant="action" bordered={false}>Aksi</Th>
    {/if}
  {/snippet}
  {#each users as user}
    <Tr>
      {#if activeTab === "student"}
        <Td variant="bold">{user.name || user.fullname || "-"}</Td>
        <Td variant="mono">{user.email || "-"}</Td>
        <Td variant="mono">{user.nisn || "-"}</Td>
        <Td variant="mono">{user.currentMajor?.name || "-"}</Td>
        <Td variant="bold" bordered={false}>{user.currentClass?.name || "-"}</Td
        >
      {:else if activeTab === "teacher"}
        <Td variant="bold">{formatFullName(user)}</Td>
        <Td variant="mono">{user.email || "-"}</Td>
        <Td variant="mono" bordered={false}>{user.nip || "-"}</Td>
      {:else if activeTab === "mentor"}
        <Td align="center">
          <Checkbox
            checked={selectedMentors.includes(user.id)}
            onchange={() => toggleSelection(user.id)}
          />
        </Td>
        <Td variant="bold">{formatFullName(user)}</Td>
        <Td variant="mono">{user.email || "-"}</Td>
        <Td>
          <div class="flex flex-col">
            <span class="font-bold text-xs"
              >{user.company?.name || "Tanpa Perusahaan"}</span
            >
            <span class="text-secondary text-xs">{user.position || "-"}</span>
          </div>
        </Td>
        <Td variant="mono">{user.phone || "-"}</Td>
        <Td variant="action" bordered={false}>
          <div class="flex justify-center gap-1">
            <ActionButton
              variant="secondary"
              icon="edit"
              label="Edit"
              onclick={() => openMentorEditModal(user)}
            />
            <ActionButton
              variant="error"
              icon="delete"
              label="Hapus"
              onclick={() => confirmDelete(user.id)}
            />
          </div>
        </Td>
      {/if}
    </Tr>
  {/each}
</Table>

<div
  class="mt-4 flex justify-end animate-fade-in-up"
  style="animation-delay: 0.3s; animation-fill-mode: both;"
>
  <Pagination bind:currentPage {totalPages} />
</div>

<!-- Modal Create / Edit Mentor -->
<Modal
  bind:show={showFormModal}
  title={formMode === "create" ? "Tambah Mentor" : "Edit Mentor"}
>
  <div class="space-y-3 font-mono">
    <FormField id="mentor-name" label="Nama Lengkap *">
      <input
        type="text"
        id="mentor-name"
        bind:value={formName}
        placeholder="Bapak Anton"
        class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
      />
    </FormField>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <FormField id="mentor-prefix-title" label="Gelar Depan">
        <input
          type="text"
          id="mentor-prefix-title"
          bind:value={formPrefixTitle}
          placeholder="Dr."
          class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField id="mentor-suffix-title" label="Gelar Belakang">
        <input
          type="text"
          id="mentor-suffix-title"
          bind:value={formSuffixTitle}
          placeholder="S.Kom."
          class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <FormField id="mentor-email" label="Email Akun *">
        <input
          type="email"
          id="mentor-email"
          bind:value={formEmail}
          placeholder="anton@company.com"
          class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField
        id="mentor-password"
        label={formMode === "create"
          ? "Password *"
          : "Reset Password (Opsional)"}
      >
        <input
          type="password"
          id="mentor-password"
          bind:value={formPassword}
          placeholder={formMode === "create"
            ? "Minimal 8 karakter"
            : "Isi untuk mereset password secara paksa"}
          class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <FormField id="mentor-phone" label="No. Telepon">
        <input
          type="tel"
          id="mentor-phone"
          bind:value={formPhone}
          placeholder="081234567890"
          class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField id="mentor-position" label="Posisi / Jabatan">
        <input
          type="text"
          id="mentor-position"
          bind:value={formPosition}
          placeholder="Senior Developer"
          class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <FormField id="mentor-company" label="Perusahaan Mitra">
      <Select
        id="mentor-company"
        options={companies.map((c) => ({ label: c.name, value: c.id }))}
        bind:value={formCompanyId}
        placeholder="-- Pilih Perusahaan --"
      />
    </FormField>

    <div class="pt-3 flex justify-end gap-1">
      <Button variant="secondary" onclick={() => (showFormModal = false)}
        >Batal</Button
      >
      <Button
        variant="success"
        onclick={handleMentorSave}
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          Menyimpan...
        {:else}
          <Icon name="save" />
          <span>Simpan</span>
        {/if}
      </Button>
    </div>
  </div>
</Modal>

<!-- Import Modal Mentor -->
<Modal
  bind:show={showImportModal}
  title={previewData.length > 0
    ? "Pratinjau Data Mentor"
    : "Import Excel Mentor"}
>
  <div class="space-y-3 font-mono">
    {#if previewData.length === 0}
      <div
        class="flex justify-between items-center bg-slate-100 border-2 border-on-background p-3 shadow-neo-sm"
      >
        <p class="text-[10px] font-bold">Butuh format datanya?</p>
        <Button variant="secondary" size="sm" onclick={downloadTemplate}>
          <Icon name="download" class="text-[10px]" /> Download Template
        </Button>
      </div>

      <div
        class="border-2 border-dashed border-on-background p-5 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer mt-4"
        onclick={() => fileInput?.click()}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && fileInput?.click()}
        aria-label="Upload file excel"
      >
        <Icon name="cloud_upload" class="text-[10px] text-secondary mb-1" />
        <p class="font-bold text-xs">
          {importFile ? importFile.name : "Klik untuk memilih file excel"}
        </p>
        <input
          type="file"
          accept=".xlsx, .xls"
          class="hidden"
          bind:this={fileInput}
          onchange={handleFileSelect}
        />
      </div>
    {:else}
      <div
        class="max-h-[200px] overflow-y-auto overflow-x-auto border-2 border-on-background shadow-neo-sm"
      >
        <Table>
          {#snippet header()}
            <Th variant="compact">Nama</Th>
            <Th variant="compact">Email</Th>
            <Th variant="compact">Telepon</Th>
            <Th variant="compact" bordered={false}>Posisi</Th>
          {/snippet}
          {#each previewData as row}
            <Tr>
              <Td variant="compact" truncate={true}>{row.name}</Td>
              <Td variant="compact" truncate={true}>{row.email}</Td>
              <Td variant="compact" truncate={true}>{row.phone || "-"}</Td>
              <Td variant="compact" truncate={true} bordered={false}
                >{row.position || "-"}</Td
              >
            </Tr>
          {/each}
        </Table>
      </div>
      <p class="text-[10px] font-bold text-secondary text-right mt-2">
        Total: {previewData.length} data valid
      </p>
    {/if}

    <div class="pt-3 flex justify-end gap-1">
      <Button
        variant="secondary"
        onclick={() => {
          showImportModal = false;
          importFile = null;
          previewData = [];
        }}>Batal</Button
      >
      <Button
        variant="success"
        onclick={handleImport}
        disabled={isImporting || previewData.length === 0}
      >
        {#if isImporting}
          Menyimpan...
        {:else}
          <Icon name="save" />
          <span>Konfirmasi Simpan</span>
        {/if}
      </Button>
    </div>
  </div>
</Modal>

<ConfirmationModal
  bind:show={showDeleteConfirm}
  title="Hapus Pengguna"
  message={activeTab === "mentor"
    ? "Apakah Anda yakin ingin menghapus mentor ini? Akun otentikasinya di Auth Server juga akan terhapus permanen."
    : "Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."}
  type="danger"
  confirmText="Ya, Hapus"
  onConfirm={handleDelete}
/>

<Modal bind:show={showBulkCompanyModal} title="Set Perusahaan Mentor">
  <div class="space-y-3 font-mono">
    <p class="text-[10px] text-secondary">
      Mengubah perusahaan untuk {selectedMentors.length} mentor yang dipilih.
    </p>
    <FormField id="bulk-company" label="Perusahaan Mitra *">
      <Select
        id="bulk_company_select"
        options={companies.map((c) => ({ label: c.name, value: c.id }))}
        bind:value={bulkCompanyId}
        placeholder="-- Pilih Perusahaan --"
      />
    </FormField>

    <div class="pt-3 flex justify-end gap-1">
      <Button variant="secondary" onclick={() => (showBulkCompanyModal = false)}
        >Batal</Button
      >
      <Button variant="success" onclick={handleBulkEditCompany}>
        <Icon name="save" />
        <span>Simpan Perubahan</span>
      </Button>
    </div>
  </div>
</Modal>

<ConfirmationModal
  bind:show={showBulkDeleteConfirm}
  title="Hapus Mentor Terpilih"
  message={`Apakah Anda yakin ingin menghapus ${selectedMentors.length} mentor yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
  type="danger"
  confirmText="Ya, Hapus Semua"
  onConfirm={handleBulkDeleteMentors}
/>
