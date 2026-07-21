# EduSpace — Platform E-Learning SMP Negeri 3 Semarang

## Cara menggunakan
1. Buka `index.html` di browser
2. Pilih role dan login dengan akun demo di bawah
3. Gunakan FAB (tombol bulat di pojok kanan bawah) untuk ganti role atau keluar

## Akun Demo
| Username       | Password | Role  | Nama              |
|----------------|----------|-------|-------------------|
| rafi@student   | 1234     | Siswa | Rafi Ananda 8A    |
| nadia@student  | 1234     | Siswa | Nadia Fitri 7A    |
| dimas@student  | 1234     | Siswa | Dimas Kurnia 8A   |
| siti@guru      | 1234     | Guru  | Siti Rahayu       |
| budi@guru      | 1234     | Guru  | Budi Prasetyo     |
| dewi@guru      | 1234     | Guru  | Dewi Nurhayati    |
| wulan@waka     | 1234     | Waka  | Dra. Wulandari    |

## Fitur auth & navigation
- **localStorage** menyimpan sesi login (key: `es_user`)
- **Auth guard** di setiap halaman — redirect ke index jika belum login
- **Role guard** — siswa tidak bisa akses halaman guru/waka, dst
- **FAB (Floating Action Button)** di pojok kanan bawah setiap halaman:
  - Klik untuk buka menu: Ganti Role, Profil, Keluar
- **Auto-inject** nama, avatar, kelas dari localStorage ke seluruh UI
- Sesi tetap aktif jika browser tidak ditutup (sessionStorage → localStorage)

## Struktur file
- `index.html` — Halaman login & pilih role
- `auth.js` — Core: USERS db, Auth API, UIRenderer, Nav, guard
- `shared.css` — CSS variables global
- `nav.js` — Legacy (digantikan auth.js)
- 28 halaman HTML (8 murid + 8 guru + 11 waka + 3 logic flow)

## Teknologi
- HTML5 + CSS3 + Vanilla JavaScript (zero dependencies)
- localStorage untuk state management
- Google Fonts: DM Sans + DM Mono
- Mermaid.js untuk diagram logic flow (CDN)
- Tidak memerlukan server — buka langsung di browser
