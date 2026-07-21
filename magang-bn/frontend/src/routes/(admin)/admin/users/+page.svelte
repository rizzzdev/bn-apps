<script lang="ts">
  import {
    Pagination,
    Modal,
    FormField,
    ConfirmationModal,
    SearchFilter,
    Select,
  } from "$lib/components/molecules";
  import { Icon, Button, ActionButton, Checkbox } from "$lib/components/atoms";
  import { apiClient } from "$lib/utils/api";
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

  let previewData = $state<any[]>([]);

  let companies = $state<any[]>([]);
  let searchQuery = $state("");

  async function fetchUsers(tab: string, page: number) {
    loading = true;
    let endpoint = "";
    if (tab === "student") endpoint = "/api/v1/students";
    else if (tab === "teacher") endpoint = "/api/v1/teachers";
    else if (tab === "mentor") endpoint = "/api/v1/industry-mentors";

    const currentSearch = untrack(() => searchQuery);
    const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : "";
    const res = await apiClient(`${endpoint}?page=${page}&limit=10${searchParam}`);
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
    const res = await apiClient(`/api/v1/companies?limit=100`);
    if (res && !res.error) companies = res.data || [];
  }

  async function handleSync() {
    let endpoint = "";
    if (activeTab === "student") endpoint = "/api/v1/webhook/students/sync";
    else if (activeTab === "teacher") endpoint = "/api/v1/webhook/teachers/sync";
    else return;

    toast.success("Memulai sinkronisasi...");
    try {
      const res = await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (res && !res.error) {
        toast.success(`Sinkronisasi ${activeTab} berhasil!`);
        fetchUsers(activeTab, 1);
      } else {
        toast.error(`Gagal sinkronisasi ${activeTab}`);
      }
    } catch (e) {
      toast.error(`Terjadi kesalahan saat sinkronisasi`);
    }
  }

  function confirmDelete(id: string) {
    selectedIdToDelete = id;
    showDeleteConfirm = true;
  }

  async function handleDelete() {
    showDeleteConfirm = false;
    let endpoint = "";
    if (activeTab === "student") endpoint = "/api/v1/students";
    else if (activeTab === "teacher") endpoint = "/api/v1/teachers";
    else if (activeTab === "mentor") endpoint = "/api/v1/industry-mentors";

    const res = await apiClient(`${endpoint}/${selectedIdToDelete}`, {
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

    let endpoint = "/api/v1/industry-mentors";
    let method = "POST";

    if (formMode === "edit") {
      endpoint = `/api/v1/industry-mentors/${formId}`;
      method = "PUT";
    }

    const res = await apiClient(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    if (res && !res.error && formMode === "edit" && formPassword) {
      const resetRes = await apiClient(
        `/api/v1/industry-mentors/${formId}/password`,
        {
          method: "PATCH",
          body: JSON.stringify({ newPassword: formPassword }),
        },
      );
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
        
        previewData = rows.map(row => ({
          name: row['Nama Lengkap']?.toString().trim() || '',
          email: row['Email']?.toString().trim() || '',
          password: row['Password']?.toString() || 'password123',
          position: row['Posisi di Perusahaan']?.toString() || null,
          phone: row['No. HP']?.toString() || null,
          prefixTitle: row['Gelar Depan']?.toString().trim() || null,
          suffixTitle: row['Gelar Belakang']?.toString().trim() || null,
        })).filter(row => row.name && row.email);

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

    const res = await apiClient("/api/v1/industry-mentors/bulk", {
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
    const res = await apiClient("/api/v1/industry-mentors/bulk/company", {
      method: "PUT",
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
      selectedMentors = selectedMentors.filter(i => i !== id);
    } else {
      selectedMentors = [...selectedMentors, id];
    }
  }

  async function downloadTemplate() {
    try {
      let accessToken = "";
      const tokenMatch = document.cookie.match(
        /(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/,
      );
      if (tokenMatch && tokenMatch[1]) accessToken = tokenMatch[1];

      const res = await fetch(
        `${PUBLIC_API_URL}/api/v1/industry-mentors/excel/template`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
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
  class="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 animate-fade-in-up"
>
  <div>
    <h2 class="font-headline text-3xl font-black uppercase tracking-tight">
      Data Pengguna
    </h2>
    <p class="font-mono text-secondary mt-1">
      Kelola akun Murid, Guru, dan Mentor.
    </p>
  </div>
  <div class="flex flex-wrap gap-2">
    {#if activeTab === "student" || activeTab === "teacher"}
      <Button variant="warning" onclick={handleSync}>
        <Icon name="sync" />
        <span>Sync Webhook</span>
      </Button>
    {/if}

    {#if activeTab === "mentor"}
      {#if selectedMentors.length > 0}
        <Button variant="primary" onclick={() => {
          if (companies.length === 0) fetchCompanies();
          showBulkCompanyModal = true;
        }}>
          <Icon name="business" />
          <span>Set Perusahaan ({selectedMentors.length})</span>
        </Button>
      {/if}
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

<div class="animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
  <SearchFilter bind:searchQuery onSearch={() => { currentPage = 1; fetchUsers(activeTab, 1); }} placeholder={`Cari ${activeTab}...`} />
</div>

<div
  class="mb-4 flex border-b-4 border-on-background animate-fade-in-up"
  style="animation-delay: 0.1s; animation-fill-mode: both;"
>
  <button
    class="px-6 py-3 font-headline font-black uppercase text-sm border-r-4 border-t-4 border-l-4 border-on-background transition-all {activeTab ===
    'student'
      ? 'bg-primary text-on-background -mb-[4px]'
      : 'bg-slate-200 border-transparent text-secondary'}"
    onclick={() => {
      activeTab = "student";
      currentPage = 1;
    }}
  >
    Murid
  </button>
  <button
    class="px-6 py-3 font-headline font-black uppercase text-sm border-r-4 border-t-4 border-on-background transition-all {activeTab ===
    'teacher'
      ? 'bg-primary text-on-background -mb-[4px] border-l-4'
      : 'bg-slate-200 border-transparent text-secondary'}"
    onclick={() => {
      activeTab = "teacher";
      currentPage = 1;
    }}
  >
    Guru
  </button>
  <button
    class="px-6 py-3 font-headline font-black uppercase text-sm border-r-4 border-t-4 border-on-background transition-all {activeTab ===
    'mentor'
      ? 'bg-primary text-on-background -mb-[4px] border-l-4'
      : 'bg-slate-200 border-transparent text-secondary'}"
    onclick={() => {
      activeTab = "mentor";
      currentPage = 1;
    }}
  >
    Mentor
  </button>
</div>

<!-- Table -->
<div
  class="border-4 border-on-background bg-surface overflow-x-auto shadow-neo animate-fade-in-up"
  style="animation-delay: 0.2s; animation-fill-mode: both;"
>
  <table class="w-full text-left border-collapse min-w-[800px]">
    <thead>
      <tr
        class="border-b-4 border-on-background bg-slate-100 font-headline font-black uppercase text-sm"
      >
        {#if activeTab === "student"}
          <th class="p-4 border-r-4 border-on-background">Nama Lengkap</th>
          <th class="p-4 border-r-4 border-on-background">Email</th>
          <th class="p-4 border-r-4 border-on-background">NISN</th>
          <th class="p-4 border-r-4 border-on-background">Jurusan</th>
          <th class="p-4">Kelas</th>
        {:else if activeTab === "teacher"}
          <th class="p-4 border-r-4 border-on-background"
            >Nama Lengkap (Gelar)</th
          >
          <th class="p-4 border-r-4 border-on-background">Email</th>
          <th class="p-4">NIP</th>
        {:else if activeTab === "mentor"}
          <th class="p-4 border-r-4 border-on-background w-12 text-center align-middle">
            <Checkbox onchange={handleSelectAll} checked={selectedMentors.length === users.length && users.length > 0} />
          </th>
          <th class="p-4 border-r-4 border-on-background">Nama Mentor (Gelar)</th>
          <th class="p-4 border-r-4 border-on-background">Email</th>
          <th class="p-4 border-r-4 border-on-background">Perusahaan & Posisi</th>
          <th class="p-4 border-r-4 border-on-background">Telepon</th>
          <th class="p-4 text-center">Aksi</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#if loading}
        <tr>
          <td colspan="6" class="p-8 text-center font-mono text-secondary"
            >Loading...</td
          >
        </tr>
      {:else if users.length === 0}
        <tr>
          <td colspan="6" class="p-8 text-center font-mono text-secondary"
            >Tidak ada data {activeTab}.</td
          >
        </tr>
      {:else}
        {#each users as user}
          <tr
            class="border-b-4 border-on-background hover:bg-blue-50 transition-colors"
          >
            {#if activeTab === "student"}
              <td class="p-4 border-r-4 border-on-background font-bold"
                >{user.name || "-"}</td
              >
              <td class="p-4 border-r-4 border-on-background font-mono text-sm"
                >{user.email || "-"}</td
              >
              <td class="p-4 border-r-4 border-on-background font-mono"
                >{user.nisn || "-"}</td
              >
              <td class="p-4 border-r-4 border-on-background"
                >{user.major || "-"}</td
              >
              <td class="p-4 font-bold">{user.className || "-"}</td>
            {:else if activeTab === "teacher"}
              <td class="p-4 border-r-4 border-on-background font-bold"
                >{formatFullName(user)}</td
              >
              <td class="p-4 border-r-4 border-on-background font-mono text-sm"
                >{user.email || "-"}</td
              >
              <td class="p-4 font-mono">{user.nip || "-"}</td>
            {:else if activeTab === "mentor"}
              <td class="p-4 border-r-4 border-on-background text-center align-middle">
                <Checkbox checked={selectedMentors.includes(user.id)} onchange={() => toggleSelection(user.id)} />
              </td>
              <td class="p-4 border-r-4 border-on-background font-bold"
                >{formatFullName(user)}</td
              >
              <td class="p-4 border-r-4 border-on-background font-mono text-sm"
                >{user.email || "-"}</td
              >
              <td class="p-4 border-r-4 border-on-background">
                <div class="flex flex-col">
                  <span class="font-bold">{user.company?.name || "Tanpa Perusahaan"}</span>
                  <span class="text-secondary text-sm">{user.position || "-"}</span>
                </div>
              </td>
              <td class="p-4 border-r-4 border-on-background font-mono text-sm"
                >{user.phone || "-"}</td
              >
              <td class="p-4 text-center flex justify-center gap-2">
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
              </td>
            {/if}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<div
  class="mt-6 flex justify-end animate-fade-in-up"
  style="animation-delay: 0.3s; animation-fill-mode: both;"
>
  <Pagination bind:currentPage {totalPages} />
</div>

<!-- Modal Create / Edit Mentor -->
<Modal
  bind:show={showFormModal}
  title={formMode === "create" ? "Tambah Mentor" : "Edit Mentor"}
>
  <div class="space-y-4 font-mono">
    <FormField id="mentor-name" label="Nama Lengkap *">
      <input
        type="text"
        id="mentor-name"
        bind:value={formName}
        placeholder="Bapak Anton"
        class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
      />
    </FormField>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField id="mentor-prefix-title" label="Gelar Depan">
        <input
          type="text"
          id="mentor-prefix-title"
          bind:value={formPrefixTitle}
          placeholder="Dr."
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField id="mentor-suffix-title" label="Gelar Belakang">
        <input
          type="text"
          id="mentor-suffix-title"
          bind:value={formSuffixTitle}
          placeholder="S.Kom."
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField id="mentor-email" label="Email Akun *">
        <input
          type="email"
          id="mentor-email"
          bind:value={formEmail}
          placeholder="anton@company.com"
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField
        id="mentor-password"
        label={formMode === "create" ? "Password *" : "Reset Password (Opsional)"}
      >
        <input
          type="password"
          id="mentor-password"
          bind:value={formPassword}
          placeholder={formMode === "create"
            ? "Minimal 8 karakter"
            : "Isi untuk mereset password secara paksa"}
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField id="mentor-phone" label="No. Telepon">
        <input
          type="tel"
          id="mentor-phone"
          bind:value={formPhone}
          placeholder="081234567890"
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField id="mentor-position" label="Posisi / Jabatan">
        <input
          type="text"
          id="mentor-position"
          bind:value={formPosition}
          placeholder="Senior Developer"
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <FormField id="mentor-company" label="Perusahaan Mitra">
      <Select
        id="mentor-company"
        options={companies.map(c => ({ label: c.name, value: c.id }))}
        bind:value={formCompanyId}
        placeholder="-- Pilih Perusahaan --"
      />
    </FormField>

    <div class="pt-4 flex justify-end gap-2">
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
<Modal bind:show={showImportModal} title={previewData.length > 0 ? "Pratinjau Data Mentor" : "Import Excel Mentor"}>
  <div class="space-y-4 font-mono">
    {#if previewData.length === 0}
      <div class="flex justify-between items-center bg-slate-100 border-4 border-on-background p-4 shadow-neo-sm">
        <p class="text-sm font-bold">Butuh format datanya?</p>
        <Button variant="secondary" size="sm" onclick={downloadTemplate}>
          <Icon name="download" class="text-sm" /> Download Template
        </Button>
      </div>

      <div class="border-4 border-dashed border-on-background p-8 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer mt-4" onclick={() => fileInput?.click()} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && fileInput?.click()} aria-label="Upload file excel">
        <Icon name="cloud_upload" class="text-4xl text-secondary mb-2" />
        <p class="font-bold">{importFile ? importFile.name : 'Klik untuk memilih file excel'}</p>
        <input type="file" accept=".xlsx, .xls" class="hidden" bind:this={fileInput} onchange={handleFileSelect} />
      </div>
    {:else}
      <div class="max-h-[300px] overflow-y-auto overflow-x-auto border-4 border-on-background shadow-neo-sm">
        <table class="w-full text-left border-collapse text-sm">
          <thead class="sticky top-0 bg-slate-100 border-b-4 border-on-background">
            <tr>
              <th class="p-2 border-r-4 border-on-background">Nama</th>
              <th class="p-2 border-r-4 border-on-background">Email</th>
              <th class="p-2 border-r-4 border-on-background">Telepon</th>
              <th class="p-2">Posisi</th>
            </tr>
          </thead>
          <tbody>
            {#each previewData as row}
              <tr class="border-b-4 border-on-background last:border-b-0">
                <td class="p-2 border-r-4 border-on-background truncate max-w-[150px]">{row.name}</td>
                <td class="p-2 border-r-4 border-on-background truncate max-w-[150px] font-mono text-xs">{row.email}</td>
                <td class="p-2 border-r-4 border-on-background truncate max-w-[100px] font-mono text-xs">{row.phone || '-'}</td>
                <td class="p-2 truncate max-w-[100px]">{row.position || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="text-sm font-bold text-secondary text-right mt-2">
        Total: {previewData.length} data valid
      </p>
    {/if}

    <div class="pt-4 flex justify-end gap-2">
      <Button variant="secondary" onclick={() => {
        showImportModal = false;
        importFile = null;
        previewData = [];
      }}>Batal</Button>
      <Button variant="success" onclick={handleImport} disabled={isImporting || previewData.length === 0}>
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
  <div class="space-y-4 font-mono">
    <FormField id="mentor-name" label="Nama Lengkap *">
      <input
        type="text"
        id="mentor-name"
        bind:value={formName}
        placeholder="Bapak Anton"
        class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
      />
    </FormField>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField id="mentor-prefix-title" label="Gelar Depan">
        <input
          type="text"
          id="mentor-prefix-title"
          bind:value={formPrefixTitle}
          placeholder="Dr."
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField id="mentor-suffix-title" label="Gelar Belakang">
        <input
          type="text"
          id="mentor-suffix-title"
          bind:value={formSuffixTitle}
          placeholder="S.Kom."
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField id="mentor-email" label="Email Akun *">
        <input
          type="email"
          id="mentor-email"
          bind:value={formEmail}
          placeholder="anton@company.com"
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField
        id="mentor-password"
        label={formMode === "create" ? "Password *" : "Reset Password (Opsional)"}
      >
        <input
          type="password"
          id="mentor-password"
          bind:value={formPassword}
          placeholder={formMode === "create"
            ? "Minimal 8 karakter"
            : "Isi untuk mereset password secara paksa"}
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField id="mentor-phone" label="No. Telepon">
        <input
          type="tel"
          id="mentor-phone"
          bind:value={formPhone}
          placeholder="081234567890"
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
      <FormField id="mentor-position" label="Posisi / Jabatan">
        <input
          type="text"
          id="mentor-position"
          bind:value={formPosition}
          placeholder="Senior Developer"
          class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
        />
      </FormField>
    </div>
    <FormField id="mentor-company" label="Perusahaan Mitra">
      <select
        id="mentor-company"
        bind:value={formCompanyId}
        class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm"
      >
        <option value="">-- Pilih Perusahaan --</option>
        {#each companies as company}
          <option value={company.id}>{company.name}</option>
        {/each}
      </select>
    </FormField>

    <div class="pt-4 flex justify-end gap-2">
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
