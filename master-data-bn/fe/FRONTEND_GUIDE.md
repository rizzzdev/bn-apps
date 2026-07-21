# 📘 Panduan Pengembangan Frontend (Master Data BN)

Selamat datang di proyek Frontend Master Data BN! Dokumen ini dirancang khusus untuk memandu para *developer* (terutama yang baru bergabung) agar cepat memahami cara kerja, aturan, arsitektur, dan teknologi yang digunakan dalam proyek ini. 

Pastikan Anda membaca dokumen ini secara saksama sebelum mulai berkontribusi pada kode.

---

## 1. 🛠️ Teknologi yang Digunakan (Tech Stack)

Proyek ini dibangun menggunakan teknologi terbaru di ekosistem JavaScript/TypeScript:
- **Framework:** [SvelteKit 2](https://kit.svelte.dev/) dengan **Svelte 5**. (Ini penting karena Svelte 5 menggunakan konsep *Runes* yang berbeda dari Svelte 4).
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) dengan pendekatan desain *Neo-brutalism* (border tebal, bayangan solid).
- **Bahasa:** TypeScript (Sangat dianjurkan untuk mendefinisikan tipe data/interface dari setiap entitas di `src/lib/types.ts`).
- **Build Tool:** Vite (Super cepat untuk pengembangan lokal).

---

## 2. 📁 Struktur Direktori & Arsitektur

Arsitektur aplikasi ini menggabungkan **Atomic Design** untuk komponen UI (*reusable*) dan **Feature-Sliced Design** untuk mengelompokkan logika bisnis per-domain (misalnya: murid, guru, mapel).

Semua kode sumber utama berada di dalam folder `src/`.

```text
src/
├── app.css                 # File CSS global & Konfigurasi variabel Tailwind
├── app.html                # Template HTML dasar
├── hooks.server.ts         # Middleware backend-sisi-SvelteKit (Autentikasi & Guard Route)
├── routes/                 # Routing halaman SvelteKit
├── lib/
│   ├── components/         # 🧱 Komponen UI Murni (Atomic Design)
│   │   ├── atoms/          # Paling kecil: Button, Icon, Input, Badge
│   │   ├── molecules/      # Gabungan atoms: FormField, PageHeader
│   │   ├── organisms/      # Gabungan complex: Sidebar, ToastContainer, Table
│   │   └── templates/      # Layout struktur: DashboardLayout
│   ├── features/           # 📦 Logika Bisnis per Fitur (Feature-Sliced)
│   │   ├── auth/           # Login form, auth logic
│   │   ├── student/        # StudentTable, StudentStats, api calls murid
│   │   └── teacher/        # TeacherTable, TeacherForm
│   ├── stores/             # 💾 State Management Global (misal: toast.svelte.ts)
│   ├── types.ts            # Definisi Interface TS Global (Student, Teacher, dll)
│   └── utils/              # ⚙️ Helper / Utility, seperti api.ts (Fetch Wrapper)
```

### 💡 Aturan Penempatan Kode:
- **Jangan** letakkan logika bisnis (memanggil API, menyimpan data murid) di dalam `lib/components/`. Komponen di sini harus "bodoh" (*dumb components*) yang hanya menerima data via *props* dan menampilkan UI.
- Semua yang berurusan dengan *business logic* sebuah entitas harus diletakkan di `lib/features/[nama-fitur]/`.
- Halaman UI di folder `routes/` (misal `routes/student/+page.svelte`) bertugas merangkai *header* dan memanggil komponen fitur seperti `<StudentTable />` dan `<StudentStats />`.

---

## 3. ✨ Aturan Penulisan Svelte 5 (Runes)

Svelte 5 memperkenalkan **Runes** (`$state`, `$derived`, `$props`). Kita tidak lagi menggunakan `export let` atau statemen reaktif `$:` bawaan Svelte 4.

### A. Mendefinisikan Props (`$props`)
Gunakan `$props()` untuk menerima properti dari komponen induk.
```svelte
<script lang="ts">
  // Cara mendefinisikan props dan memberikan default value (opsional)
  let { title, description, variant = 'primary' } = $props<{
    title: string;
    description: string;
    variant?: 'primary' | 'secondary';
  }>();
</script>

<h1>{title}</h1>
```

### B. Membuat State Lokal (`$state`)
Gunakan `$state()` untuk variabel yang datanya bisa berubah dan merender ulang UI.
```svelte
<script lang="ts">
  let isModalOpen = $state(false);
  let count = $state(0);

  function increment() {
    count++; // UI akan otomatis ter-update
  }
</script>
```

### C. State Turunan (`$derived`)
Gunakan `$derived()` jika Anda ingin membuat nilai reaktif yang bergantung pada `$state` lain.
```svelte
<script lang="ts">
  let count = $state(0);
  let isDouble = $derived(count * 2);
</script>
```

### D. Mengganti `<slot />` dengan Snippet
Svelte 5 menggunakan fungsi render `{@render}` untuk menyuntikkan komponen dari luar (dulu disebut *slot*).
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children } = $props<{ children?: Snippet }>();
</script>

<div class="card">
  <!-- Merender konten yang disisipkan dari luar -->
  {@render children?.()} 
</div>
```

---

## 4. 🎨 Styling dan Desain (Neo-brutalism)

Aplikasi ini menggunakan tema desain *Neo-brutalism*. Jika Anda membuat komponen baru, pastikan desainnya selaras dengan komponen yang sudah ada. 

**Ciri khas styling Tailwind kita:**
- Menggunakan border tebal (contoh: `border-3 border-on-background`).
- Menggunakan bayangan tajam/solid tanpa blur (contoh custom class: `shadow-neo` atau `shadow-neo-sm`).
- Menambahkan efek transisi bergeser (*translate*) saat di-*hover* (contoh: `hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-xs`).
- Variabel warna global merujuk ke token seperti `bg-primary`, `text-on-primary`, `bg-error`, dll. Jangan sembarang pakai warna `bg-blue-500`.

---

## 5. 🌐 Interaksi API & Autentikasi

### A. Fetch Data API (`apiClient`)
Jangan pernah menggunakan `fetch` native langsung ke backend. Gunakan wrapper `apiClient` dari `src/lib/utils/api.ts`.
Wrapper ini sudah mengurus:
- Penambahan header `Authorization: Bearer <token>`.
- Mengirim Cookie secara otomatis (`credentials: 'include'`).
- Mengatur alur pembaruan token (*Refresh Token*) secara otomatis jika token kedaluwarsa (401).
- Melempar kembali user ke halaman `/login` jika sesi benar-benar habis.

**Contoh Penggunaan di Komponen (onMount):**
```ts
import { apiClient } from '$lib/utils/api';
import { onMount } from 'svelte';

let stats = $state({ totalMurid: 0 });

onMount(async () => {
    try {
        const res = await apiClient('/students/statistic');
        const result = await res.json();
        if (result.data) {
            stats = result.data;
        }
    } catch (e) {
        console.error('Failed to fetch', e);
    }
});
```

### B. Middleware / Server Hooks Guard (`hooks.server.ts`)
Semua rute dilindungi di level server oleh file `hooks.server.ts`. 
- Sistem akan membaca Cookie (`access_token` atau `refresh_token`).
- Jika user mengakses rute internal tanpa token, sistem langsung membelokkan (*redirect*) ke halaman `/login`.
- Di dalam hook ini pula, SvelteKit memanggil `/auth/me` untuk memvalidasi user, dan jika user bukan `super_admin`, sistem akan membelokkannya ke `/403`.

---

## 6. 📦 Global State Management (Class-Based)

Kita menghindari penggunaan store bawaan Svelte 4 (`writable`). Di Svelte 5, state global disarankan menggunakan pendekatan **Class-Based State** dengan mendeklarasikan variabel `$state` di dalam class.

Lihat contoh `src/lib/stores/toast.svelte.ts`:
```ts
// File: src/lib/stores/toast.svelte.ts
class ToastState {
    toasts = $state<ToastMessage[]>([]);

    add(type, message) {
        // ... logika menambahkan notifikasi
    }
}
export const toast = new ToastState();
```
**Cara Menggunakannya di Komponen:**
```ts
import { toast } from '$lib/stores/toast.svelte';

function handleSuccess() {
    toast.success('Data murid berhasil disimpan!');
}
```

---

## 💡 Pesan untuk Junior Programmer

1. **Ikuti Pola (Pattern):** Jika ingin membuat tabel guru, pelajari kode tabel murid di `features/student/components/student-table.svelte`. Salin pendekatan yang berhasil dari situ.
2. **Lihat Atoms:** Jangan membuat *Button* atau *Input* dari awal. Gunakan apa yang sudah ada di `lib/components/atoms/`.
3. **Pahami Tipe Data:** Selalu gunakan/buat tipe data di `types.ts`. Misalnya, jika API mengembalikan data `Student`, *binding* data tersebut dengan variabel bertipe `Student[]`.
4. **Bertanya Jika Bingung:** Arsitektur ini dibuat untuk keteraturan. Jika Anda kebingungan di mana harus menaruh suatu file logika, tanyakan kepada tim alih-alih meletakkannya di tempat yang salah.

Selamat menulis kode! 🚀
