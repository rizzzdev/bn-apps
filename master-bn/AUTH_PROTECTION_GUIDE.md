# 🛡️ Panduan Proteksi Autentikasi & Otorisasi (Master Data BN)

Dokumen ini menjelaskan arsitektur, alur kerja, serta panduan implementasi proteksi halaman (halaman `/login` dan rute terproteksi/non-login) di proyek **Master Data BN Frontend (SvelteKit 2 & Svelte 5)**.

---

## 🎯 1. Ikhtisar Arsitektur Autentikasi

Proyek ini menerapkan pendekatan **Hybrid Protection** (Server-Side + Client-Side) untuk memastikan keamanan rute dan pengalaman pengguna (_user experience_) yang responsif:

1. **Server-Side Protection (`src/hooks.server.ts`)**:
   - Berfungsi sebagai _Middleware_ di level server.
   - Mencegah _flash of unauthenticated content_ (FOUC).
   - Memeriksa status Cookie (`access_token`, `refresh_token`, atau `sentri-session`).
   - Mengarahkan (_redirect_) pengguna sebelum halaman dirender di browser.
   - Melakukan validasi _Role-Based Access Control_ (RBAC).

2. **Client-Side Interceptor (`src/lib/utils/api.ts`)**:
   - Membungkus semua request API menggunakan wrapper `apiClient`.
   - Mengirim token secara otomatis via header `Authorization: Bearer <token>`.
   - Menangani _token expiration_ (HTTP 401) secara transparan dengan me-refresh token secara otomatis.
   - Mengarahkan pengguna kembali ke halaman `/login` jika sesi habis total.

---

## 🔒 2. Proteksi Server-Side (`src/hooks.server.ts`)

File [hooks.server.ts](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/hooks.server.ts) adalah garda terdepan proteksi rute di SvelteKit.

```
                    ┌────────────────────────┐
                    │ Request Masuk ke Server│
                    └───────────┬────────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │ Cek Token di Cookie       │
                  │ (access_token / refresh)  │
                  └─────────────┬─────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
 [User Terautentikasi]                       [User Belum Logged In]
        │                                               │
   ┌────┴────┐                                     ┌────┴────┐
   │ Halaman?│                                     │ Halaman?│
   └────┬────┘                                     └────┬────┘
   ┌────┴─────────────────┐                       ┌─────┴────────────────┐
   ▼                      ▼                       ▼                      ▼
[/login]            [Lainnya]                  [/login]              [Lainnya]
   │                      │                       │                      │
   ▼                      ▼                       ▼                      ▼
Redirect /           Verifikasi              Izinkan Akses        Redirect /login
                     Role & Session
                          │
                   ┌──────┴──────┐
                   ▼             ▼
              [SuperAdmin]  [Non-Admin]
                   │             │
                   ▼             ▼
               Akses OK     Redirect /403
```

### A. Pembagian Kategori Rute

- **Guest Route (`/login`)**: Rute khusus untuk pengguna yang **belum** masuk.
- **Forbidden Route (`/403`)**: Halaman khusus ketika pengguna terautentikasi tetapi tidak memiliki hak akses (_Role_).
- **Protected Routes (Selain `/login` & `/403`)**: Semua rute internal seperti `/`, `/student`, `/teacher`, `/major`, `/class`, `/academic-year`, `/subject`, `/role`.

---

### B. Aturan & Proteksi Rute

#### 1. Proteksi Halaman Login (Guest Route Guard)

Jika pengguna **sudah login** tetapi mencoba mengakses rute `/login`, sistem akan membelokkan mereka secara otomatis ke Dasbor (`/`).

```typescript
// src/hooks.server.ts
const isLoggedIn = !!(accessToken || refreshToken);
const isLoginPage = event.url.pathname === '/login';

if (isLoggedIn && isLoginPage) {
	throw redirect(303, '/');
}
```

#### 2. Proteksi Halaman Selain Login (Protected Route Guard)

Jika pengguna **belum login** tetapi mencoba mengakses rute apa pun selain `/login`, sistem akan langsung menolak dan mengarahkan mereka ke `/login`.

```typescript
// src/hooks.server.ts
if (!isLoggedIn && !isLoginPage) {
	throw redirect(303, '/login');
}
```

---

### C. Alur Silent Refresh Token & Validasi Session

Ketika pengguna yang sudah login mengakses halaman terproteksi:

1. **Auto Refresh Token di Server**:
   Jika `access_token` kadaluwarsa/hilang namun `refresh_token` masih ada, server akan memanggil endpoint `/auth/refresh` untuk mendapatkan `access_token` baru dan memperbarui Cookie browser secara otomatis.

2. **Validasi User Session (`GET /auth/me`)**:
   Server memanggil endpoint `/auth/me` untuk mendapatkan informasi profil pengguna terbaru.
   - Jika response **OK**: Data pengguna disimpan ke `event.locals.user`.
   - Jika response **Gagal**: Semua Cookie dihapus (`access_token`, `refresh_token`, `sentri-session`) dan pengguna di-redirect ke `/login`.

3. **Otorisasi Berbasis Peran (RBAC)**:
   Sistem mengecek peran pengguna (`user.roles`).
   - Saat ini, rute internal memprioritaskan peran `super_admin`.
   - Pengguna non-admin yang mengakses rute internal akan di-redirect ke halaman [403 Forbidden](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/routes/403/+page.svelte).
   - Pengguna `super_admin` yang mencoba mengakses `/403` akan di-redirect kembali ke `/`.

---

## 📦 3. Penyebaran Data User ke Komponen Front-End

Untuk menggunakan data pengguna yang telah divalidasi oleh `hooks.server.ts` di komponen Svelte:

### 1. Definisi Tipe ([app.d.ts](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/app.d.ts))

```typescript
declare global {
	namespace App {
		interface Locals {
			user?: {
				id: string;
				identifier: string;
				roles: string[];
				[key: string]: unknown;
			};
		}
	}
}
```

### 2. Passing Data via Root Layout Server Load ([+layout.server.ts](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/routes/+layout.server.ts))

```typescript
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
	};
};
```

### 3. Mengakses Data di Komponen Svelte 5 ([side-nav-bar.svelte](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/lib/components/organisms/side-nav-bar.svelte))

```svelte
<script lang="ts">
	import { page } from '$app/stores';

	let user = $derived($page.data.user);
	// user.id, user.roles, user.identifier tersedia secara otomatis
</script>
```

---

## ⚡ 4. Proteksi Client-Side Interceptor ([api.ts](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/lib/utils/api.ts))

Setiap pemanggilan API di sisi client **WAJIB** menggunakan `apiClient`.

### Cara Kerja `apiClient`:

1. Membaca `access_token` dari Cookie.
2. Menyisipkan `Authorization: Bearer <access_token>` dan `credentials: 'include'`.
3. Jika backend merespons dengan **HTTP 401 Unauthorized**:
   - `apiClient` secara otomatis memanggil `/auth/refresh`.
   - Jika refresh **berhasil**: Token baru disimpan ke Cookie, dan request asli diulang (_retry_) tanpa mengganggu pengguna.
   - Jika refresh **gagal**: Cookie dihapus, notifikasi toast error ditampilkan, dan browser di-redirect ke `/login` via `goto('/login')`.

#### Contoh Penggunaan:

```typescript
import { apiClient } from '$lib/utils/api';

async function loadData() {
	const res = await apiClient('/students');
	if (res.ok) {
		const data = await res.json();
	}
}
```

---

## 🔑 5. Alur Login & Logout Handshake

### A. Alur Login ([login-form.svelte](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/lib/features/auth/components/login-form.svelte))

1. Pengguna memasukkan `identifier` (Email/NIP/NIS) dan `password`.
2. Form mengirim HTTP POST ke `${PUBLIC_API_URL}/auth/login` dengan `credentials: 'include'`.
3. Setelah menerima `accessToken`:
   ```typescript
   setCookie('access_token', newAccessToken, 900); // Masa berlaku 15 menit
   ```
4. Melakukan **Full Page Reload** (`window.location.href = '/'`):
   > ⚠️ **PENTING**: Full page reload diperlukan agar `hooks.server.ts` mengeksekusi ulang validasi server-side, menetapkan `locals.user`, dan memverifikasi otorisasi halaman.

### B. Alur Logout ([side-nav-bar.svelte](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/lib/components/organisms/side-nav-bar.svelte) & [403/+page.svelte](file:///c:/Users/rplsm/Documents/bn-apps/master-data-bn/fe/src/routes/403/+page.svelte))

1. Memanggil endpoint `/auth/logout` melalui HTTP POST dengan `credentials: 'include'`.
2. Backend akan menghapus Cookie session di sisi HTTP.
3. Client menghapus sisa data lokal dan berpindah halaman:
   ```typescript
   localStorage.removeItem('accessToken');
   goto('/login');
   ```

---

## 📊 6. Matriks Proteksi Rute (Route Guard Matrix)

| Status User                      | Rute yang Diakses       | Hasil / Action Sistem                       |
| :------------------------------- | :---------------------- | :------------------------------------------ |
| **Belum Login**                  | `/login`                | ✅ Diizinkan (_Guest Route_)                |
| **Belum Login**                  | `/` atau rute lain      | ⛔ Redirect ke `/login` (303)               |
| **Sudah Login**                  | `/login`                | ⛔ Redirect ke `/` (303)                    |
| **Sudah Login (Super Admin)**    | `/` atau `/student` dsb | ✅ Diizinkan                                |
| **Sudah Login (Non-Admin)**      | `/` atau rute internal  | ⛔ Redirect ke `/403` (303)                 |
| **Sudah Login (Super Admin)**    | `/403`                  | ⛔ Redirect ke `/` (303)                    |
| **Token Expired (Refresh OK)**   | Rute Apapun             | 🔄 Auto-refresh token, request dilanjutkan  |
| **Token Expired (Refresh Fail)** | Rute Apapun             | ⛔ Cookie dibersihkan, redirect ke `/login` |

---

## 📝 7. Panduan Ringkas Bagi Developer

1. **Membuat Halaman Baru**:
   - Semua folder baru di bawah `src/routes/` (misal `src/routes/report/`) secara otomatis terproteksi oleh `hooks.server.ts`. Tidak perlu menambah guard manual per halaman.
2. **Pemanggilan API**:
   - **Selalu** gunakan `apiClient('/endpoint')` dari `$lib/utils/api`. Jangan gunakan `fetch()` biasa untuk API terproteksi.
3. **Membaca Profil User di Svelte 5**:
   - Gunakan `$page.data.user` dari `$app/stores` untuk membaca informasi user yang sedang login.
4. **Variabel Lingkungan (Environment Variables)**:
   - Gunakan `PUBLIC_API_URL` untuk pemanggilan client-side.
   - Gunakan `INTERNAL_API_BASE` di `hooks.server.ts` jika API backend berada di jaringan docker/internal yang berbeda.

---
