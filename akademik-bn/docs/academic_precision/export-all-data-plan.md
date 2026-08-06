# Rencana (Final): Export Data Mapping — Kompatibel Import Ulang

> **Masalah:** Data _mapping_ di project academic (jurusan murid, kelas murid, guru mapel, matriks alokasi JP, halangan guru, jadwal piket) hanya bisa dimasukkan via form/upload Excel, tetapi tidak bisa diunduh kembali sebagai file.
> **Tujuan:** Setiap dataset mapping yang punya fitur import Excel mendapat tombol **Export Excel** yang mengunduh **seluruh data** sebagai `.xlsx` dengan **label kolom persis sama dengan template import** → file hasil export bisa langsung di-upload ulang ke fitur import (round-trip: export → edit → import), termasuk untuk deployment di production.
> **Bukan scope:** data master (guru, mapel, jurusan, kelas, jam pelajaran, jadwal pelajaran hasil generator) — konfirmasi user: export adalah untuk **data mapping** saja.

---

## 1. Ringkasan Eksekutif

- **Backend:** 6 endpoint `GET /{resource}/export` (1 per dataset mapping) + helper `buildExcelExport(sheetName, specs, rows)` di `src/app/utils/excel.ts` (workbook murni data: header tebal + freeze + auto-width, tanpa sample-row/dropdown).
- **Kolom export = header template import yang sudah ada** (label persis) → file 100% kompatibel di-upload ulang via `POST /{resource}/batch/excel`.
- **Email guru/murid** diambil dari orchestrator master via lookup **by ID** (`masterTeacher.findByIds()` / `masterStudent.findByIds()` — `teacherId`/`studentId` di data mapping == id master) → **tanpa migrasi DB / tanpa field email baru**.
- **Frontend:** tombol Export (ikon `download`) di halaman yang sama dengan tombol import-nya; tombol export untuk data master (yang sempat terpasang di `/teacher`, `/lesson-hours`, `/lesson-schedule`) **dihapus**.
- **Tidak ada perubahan skema DB, tidak ada migrasi.**

---

## 2. Dataset yang Di-Export (6 mapping, import-compatible)

| Dataset                                               | Halaman                              | Kolom export = header template import (persis)                                                          |
| ----------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Guru Mapel** (`subject-teachers`)                   | `/subject`                           | `Email Guru`, `Kode Mapel`, `Target Beban JP`, `Status`                                                 |
| **Jurusan Murid** (`major-students`)                  | `/major-students`                    | `Email Murid`, `Kode Jurusan`, `Status`                                                                 |
| **Kelas Murid** (`class-students`)                    | `/class-students`                    | `Email Murid`, `Nama Kelas`, `Status`                                                                   |
| **Matriks Alokasi JP** (`class-subject-requirements`) | `/lesson-schedule/generator` (Tab 1) | `Nama Kelas`, `Kode Mapel`, `Email Guru`, `JP Mingguan`, `Max JP / Hari`, `JP Batch`, `Kode Grup Batch` |
| **Halangan Guru** (`teacher-unavailabilities`)        | `/lesson-schedule/generator` (Tab 2) | `Email Guru`, `Hari`, `Jam ke-`                                                                         |
| **Jadwal Piket** (`teacher-picket-schedules`)         | `/schedule`                          | `Email Guru`, `Hari` (+ pelengkap `Nama Guru`, `Status`)                                                |

> Export **Jadwal Piket** menambah 2 kolom pelengkap di luar template — parser import mengabaikan label tak dikenal, jadi tetap kompatibel.

### 2.1 Bagaimana email didapat (tanpa kolom email baru)

- Tabel shadow tidak menyimpan email (`shadowTeacher`/`shadowStudent` hanya punya `userId`), dan `teacherId`/`studentId` di data mapping adalah **id master**.
- Export memakai `getOrchestrator().masterTeacher.findByIds(ids)` / `masterStudent.findByIds(ids)` → map `id → email` (kebalikan dari lookup email→id yang dipakai `bulkCreateFromExcel`).
- Baris mapping tanpa `teacherId` (mis. alokasi JP tanpa guru) diexport dengan `Email Guru` kosong → saat di-upload ulang baris tersebut gagal validasi (import mewajibkan lookup email) dan dilaporkan di `failedRows`. Ini by design.

---

## 3. Desain

### 3.1 Backend

- Helper `buildExcelExport` (sudah ada sejak implementasi awal, tetap dipakai):
  ```ts
  buildExcelExport(sheetName: string, specs: HeaderSpec[], rows: Record<string, unknown>[]): Promise<Buffer>
  ```
- Per dataset: `getExcelExport()` di service (query `findMany({ where: { deletedAt: null } })` tanpa pagination + lookup `findByIds`), `downloadExcelExport = createDownloadTemplateHandler('{resource}_export.xlsx', () => service.getExcelExport())` di controller, dan `GET /{resource}/export` di route **sebelum `/:id`**.
- Endpoint: `/academic/subject-teachers/export`, `/academic/major-students/export`, `/academic/class-students/export`, `/academic/class-subject-requirements/export`, `/academic/teacher-unavailabilities/export`, `/academic/teacher-picket-schedules/export`.

### 3.2 Frontend

- Handler `handleExport()` → `downloadExcel(endpoint, '{nama}_${YYYY-MM-DD}.xlsx')` + toast sukses/gagal.
- Nama file: `guru-mapel_…`, `jurusan-murid_…`, `kelas-murid_…`, `matriks-alokasi-jam_…`, `halangan-guru_…`, `jadwal-piket_…`.

| Halaman                                         | Aksi                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `/subject`                                      | Export guru mapel (repoint dari shadow-subjects)                        |
| `/major-students`                               | Export jurusan murid (repoint dari shadow-majors)                       |
| `/class-students`                               | Export kelas murid (repoint dari shadow-classes)                        |
| `/lesson-schedule/generator`                    | Tambah 2 tombol: matriks alokasi (Tab 1) + halangan guru (Tab 2)        |
| `/schedule`                                     | Export jadwal piket (sudah benar, filename disamakan `jadwal-piket_…`)  |
| `/teacher`, `/lesson-hours`, `/lesson-schedule` | **Tombol export dihapus** (data master / hasil generator — bukan scope) |

### 3.3 Yang Di-revert

- Export master yang sempat diimplementasikan **dikembalikan ke HEAD** (git): `shadow.route.ts` (4 endpoint shadow-*/export), `lesson-hours` (service/controller/route), `lesson-schedules` (service/controller/route).

---

## 4. Fase Implementasi (status: ✅ selesai)

| Fase | Isi                                                                                                                                    | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | Revert export master (shadow, lesson-hours, lesson-schedules) ke HEAD                                                                  | ✅     |
| 2    | `getExcelExport()` di 5 service mapping (subject-teachers, major-students, class-students, CSR, TU) + controller + route `GET /export` | ✅     |
| 3    | Frontend: repoint/remove tombol di 7 halaman + 2 tombol baru di generator                                                              | ✅     |
| 4    | Validasi & review                                                                                                                      | ✅     |

## 5. Validasi (hasil)

- `npx tsc --noEmit` di `api-bn`: **hanya error pre-existing exam** tersisa. Boot path `APP_BOOT_OK`.
- Runtime round-trip: `buildExcelExport` → `parseExcel` (dengan `buildHeaderLabelMap`) membaca kembali nilai dengan benar (angka dibaca string lalu dikonversi `Number()` — sama seperti import asli). `ROUNDTRIP_OK`.
- Frontend: `svelte-check` 0 error 0 warning, `eslint` 0 error, `prettier` bersih.
- Review kode: lookup email konsisten `findByIds()` dengan export piket; rute `/export` sebelum `/:id`; null-handling aman.

---

## 6. Risiko & Mitigasi

| Risiko                          | Mitigasi                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Rute `/:id` menangkap `/export` | `/export` dideklarasikan sebelum `/:id` (pola `/template`)                                 |
| Email tidak ada di tabel shadow | Map `id → email` dari orchestrator master via `findByIds`                                  |
| Baris mapping tanpa guru        | `Email Guru` kosong; saat import ulang masuk `failedRows` (dilaporkan, bukan error global) |
| Ribuan baris                    | Export tanpa pagination wajar untuk skala sekolah; exceljs menangani 1 juta+ baris         |
