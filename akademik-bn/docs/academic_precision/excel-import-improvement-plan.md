# Rencana Perbaikan: Upload Excel untuk Input Data Akademik

> **Masalah:** Input data jurusan murid, kelas murid, guru mapel, matriks alokasi jam pelajaran, halangan guru, dan jadwal piket masih manual satu-per-satu (klik, pilih, simpan). Tidak ada fitur upload Excel.
> **Tujuan:** Sediakan alur **Download Template → Isi Excel → Upload → Laporan baris gagal** yang seragam untuk keenam dataset, mengikuti pola yang **sudah ada dan terbukti** di modul `master` api-bn.
> **Prioritas user:** Guru Mapel = concern utama → dikerjakan paling awal (Fase 1).

---

## 1. Ringkasan Eksekutif

- Infrastruktur Excel **sudah lengkap** di `api-bn` (`exceljs`, `xlsx`, `multer` sudah terpasang; ada `parseExcel`, `generateExcelTemplate`, helper controller, dan middleware upload) — modul `academic` **tinggal memakainya**, tidak perlu bangun dari nol.
- Semua modul academic **sudah punya endpoint batch JSON** (`POST /batch`, dst.) yang bisa dipakai ulang sebagai sasaran penyimpanan hasil parsing Excel.
- Yang kurang hanya: (a) endpoint `GET /{resource}/template` + `POST /{resource}/batch/excel` per modul academic, (b) method service `getExcelTemplate()` + `bulkCreateFromExcel()` per modul, (c) komponen UI import/export yang reusable di frontend, (d) helper download file di frontend.
- Frontend `apiClient` **sudah mendukung FormData** (menghapus `Content-Type` otomatis) → upload tanpa perubahan dasar HTTP.
- Estimasi: Fase 1 (Guru Mapel) ~1 hari kerja; total seluruh 6 dataset ~3–4 hari kerja.

---

## 2. Audit Kondisi Saat Ini

### 2.1 Alur input saat ini (pain points)

| Dataset             | Lokasi UI                          | Cara input sekarang                                                              | Keluhan                                                                                          |
| ------------------- | ---------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Guru Mapel**      | `/subject/[id]`                    | Tambah guru satu-per-satu via modal multi-select + isi target JP                 | ⭐ Sangat merepotkan utk puluhan guru × banyak mapel (contoh: 40 guru × 20 mapel = ratusan klik) |
| Jurusan Murid       | `/major-students/[id]`             | Centang murid satu-per-satu dari daftar yang tersedia                            | Murid ratusan orang; tidak ada input massal berbasis file                                        |
| Kelas Murid         | `/class-students/[id]`             | Sama seperti jurusan murid                                                       | Sama; 30+ kelas × ±36 murid                                                                      |
| Matriks Alokasi Jam | `/lesson-schedule/generator` Tab 1 | "Buat Mapping Baru" satu per satu (kelas × mapel × guru × JP × batch × max/hari) | Matriks kelas×mapel besar → sangat banyak pengulangan form                                       |
| Halangan Guru       | `/lesson-schedule/generator` Tab 2 | Klik sel demi sel (hari × jam) per guru                                          | 5 hari × 10 jam × 40 guru = 2000 klik                                                            |
| Jadwal Piket        | `/schedule`                        | "Atur Piket Guru" per hari                                                       | 40 guru dipilih satu-per-satu per hari                                                           |

### 2.2 Backend (repo sibling `api-bn`, path relatif ke `api-bn/`)

**Infrastruktur Excel yang SUDAH ADA (jangan dibangun ulang):**

| Aset                                                         | Lokasi                                                                                                                                    | Fungsi                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `parseExcel(buffer, requiredCols, headerMap)`                | `src/app/utils/excel.ts`                                                                                                                  | Parse sheet pertama → array objek; header baris-1 dinormalisasi label Indonesia → key kanonik |
| `generateExcelTemplate(headers, sheet, sample, validations)` | `src/app/utils/excel.ts`                                                                                                                  | Generate template `.xlsx` (label Indonesia + sample row + dropdown validasi)                  |
| `buildHeaderLabelMap(specs)` + `HeaderSpec`                  | `src/app/utils/excel.ts`                                                                                                                  | Spesifikasi kolom `{ label, key, width }`                                                     |
| `createDownloadTemplateHandler(filename, getTemplate)`       | `src/app/utils/excel-controller-helpers.ts`                                                                                               | Factory handler `GET /{resource}/template` (konvensi seluruh project)                         |
| `createUploadExcelHandler(processFile)`                      | `src/app/utils/excel-controller-helpers.ts`                                                                                               | Factory handler `POST /{resource}/batch/excel`, field multipart `"file"`, validasi file wajib |
| `uploadExcel` (multer memory, hanya `.xlsx`/`.xls`, 5 MB)    | `src/master/src/middlewares/upload.middleware.ts`                                                                                         | Middleware upload (perlu diekspor ke level `#app` atau diduplikasi kecil di academic)         |
| Pola lengkap (template + import + laporan baris gagal)       | modul `master`: `teacher`, `student`, `subject`, `class`, `major`, `application`, `company`, `industry-mentor` + modul `exam`: `question` | Referensi implementasi                                                                        |

**Endpoint batch JSON yang SUDAH ADA per modul academic (sasaran penyimpanan):**

| Modul                        | Endpoint batch yang ada                                                                    | Catatan                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `major-students`             | `POST /batch`, `DELETE /batch`, `PATCH /batch/status`, `POST /transfer`, `POST /graduate`  | body `{ data: [...] }`                          |
| `class-students`             | `POST /batch`, `DELETE /batch`, `POST /promote                                             | hold                                            | transfer | graduate` | body `{ data: [...] }` |
| `subject-teachers`           | `DELETE /batch`, `PATCH /batch/status`, `PATCH /batch/target-hours`                        | ⚠️ **TIDAK ada `POST /batch`** → perlu ditambah |
| `class-subject-requirements` | `POST /batch` (`bulkUpsert` + validasi overload & batch), `DELETE /batch`, `DELETE /clear` | body `{ requirements: [...] }`                  |
| `teacher-unavailabilities`   | `POST /batch` (`bulkSet` per guru), `POST /batch/delete`                                   | body `{ teacherId, unavailabilities }`          |
| `teacher-picket-schedules`   | `POST /batch`, `DELETE /batch`, `PATCH /batch/status`                                      | body `{ data: [...] }`                          |

**Pola `bulkCreateFromExcel` di modul master (yang akan ditiru):**

1. `parseExcel` dengan `requiredColumns` + `buildHeaderLabelMap(HEADERS)`.
2. Fase validasi per baris **tanpa melempar exception** → baris gagal dikumpulkan ke `failedRows` (berisi data baris + `reason`).
3. Fase simpan (transaksi per modul / tanpa transaksi global) → `successRows`.
4. Return `{ createdItems, successCount, successRows, failedRows }` → response API `{ count, successCount, failedRows }`.

### 2.3 Frontend (repo `akademik-bn`)

- `src/lib/utils/api.ts` → `apiClient` **sudah mendukung `FormData`** (otomatis hapus `Content-Type`, lengkap dgn retry refresh token). Tidak perlu ubah.
- **Belum ada** helper download file (blob → simpan) di frontend → perlu ditambah.
- **Belum ada** komponen UI import/export → perlu dibuat 1 komponen reusable.
- `src/lib/services/base.ts` → kandidat tempat helper `uploadExcel()` & `downloadExcel()`.
- Data master (kelas, mapel, guru, murid, jam) sudah bisa diambil via API shadow (`shadow-classes`, `shadow-subjects`, `shadow-teachers`, `shadow-students`, `lesson-hours`) untuk **validasi kolom referensi di UI** (opsional, enhancement).

---

## 3. Arsitektur Solusi (Pola Baku)

Untuk **setiap** dataset, sediakan 2 endpoint + 1 komponen UI yang sama:

```
GET  /academic/{resource}/template      → unduh template .xlsx (label Indonesia, sample row, dropdown)
POST /academic/{resource}/batch/excel   → upload (field "file"), parse, validasi per baris, simpan, laporan
```

**Alur di UI:**

1. Klik **"Download Template"** → file `.xlsx` terisi kolom + 1 baris contoh + dropdown validasi.
2. Isi baris data di Excel (bisa copy-paste dari data eksisting / raport / dapodik).
3. Upload file → frontend kirim `FormData` → backend parsing & validasi **per baris**.
4. Tampilkan ringkasan: `N berhasil`, daftar baris gagal (data + alasan) → user perbaiki & upload ulang (baris yang sudah sukses akan di-skip/duplicate-safe).
5. Halaman refresh otomatis.

**Prinsip desain (mengikuti DESAIN.md & plan generator sebelumnya):**

- **Per-baris validation, bukan all-or-nothing** → 1 baris error tidak menggagalkan 1000 baris lain.
- **Duplicate-safe** → baris yang identik dengan data yang sudah ada di-skip (reactivate jika soft-deleted), dicatat di laporan, bukan error.
- **Backward compatible** → tidak ada perubahan skema DB; tidak ada perubahan endpoint lama.
- **Deterministik** → lookup referensi **selalu via email** untuk guru & murid, dan `code` untuk jurusan/mapel/kelas (key yang unik & stabil); sort sebelum iterasi.
- **Normalisasi identitas** → email dicocokkan setelah `trim()` + `lowercase()` (baik dari file maupun dari DB) agar perbedaan huruf besar/kecil & spasi tidak membuat baris gagal.

---

## 4. Spesifikasi Template per Dataset

Konvensi kolom: `label` (Indonesia, tampil di Excel) + `key` (kanonik, dipakai di kode). `REQUIRED` = wajib, `DROP` = dropdown, `OPT` = opsional.

> **Catatan identitas (penting):** lookup guru & murid memakai **email**, bukan NIP/NIS/NISN — karena `Teacher.nip`, `Student.nis`, dan `Student.nisn` bersifat **nullable** (`String?`), sedangkan email **dijamin ada** untuk setiap guru/murid (akun auth dibuat dari email; template import modul `master` juga mewajibkan `email`). Semua cocokkan email dilakukan case-insensitive (trim + lowercase).
>
> **Dropdown enum (strict):** kolom berjenis `DROP` (status, hari, kode jurusan, nama kelas, kode mapel, jam ke-) dilengkapi **data validation dropdown** di template yang **bersifat strict** — Excel menolak nilai di luar daftar (error dialog). Daftar jurusan/kelas/mapel/jam diambil dari **data master terbaru** saat template di-generate (bukan hardcoded), sehingga pilihan selalu sinkron dengan data shadow saat itu.

### 4.1 Guru Mapel (`subject-teachers`) — 🥇 PRIORITAS UTAMA

| Label Excel     | Key           | Ket.     | Validasi                                                                        |
| --------------- | ------------- | -------- | ------------------------------------------------------------------------------- |
| Email Guru      | `email`       | REQUIRED | Cocok dgn `shadow_teachers.email` (trim + lowercase saat dicocokkan; wajib ada) |
| Kode Mapel      | `subjectCode` | REQUIRED | Cocok dgn `shadow_subjects.code`                                                |
| Target Beban JP | `targetHours` | REQUIRED | integer ≥ 0 (default 0)                                                         |
| Status          | `status`      | DROP     | `Aktif` / `TidakAktif` (default `Aktif`)                                        |

**Aturan:**

- 1 baris = 1 relasi `SubjectTeacher(teacherId, subjectId)`.
- Duplikat (guru+mapel sama, masih Aktif) → skip + catat laporan.
- Import memanggil **endpoint `POST /batch` yang BARU** (lihat §6.1) — saat ini `subject-teachers` belum punya bulk create JSON.

### 4.2 Jurusan Murid (`major-students`)

| Label Excel  | Key         | Ket.     | Validasi                                                        |
| ------------ | ----------- | -------- | --------------------------------------------------------------- |
| Email Murid  | `email`     | REQUIRED | Cocok dgn `shadow_students.email` (trim + lowercase; wajib ada) |
| Kode Jurusan | `majorCode` | REQUIRED | Cocok dgn `shadow_majors.code`                                  |
| Status       | `status`    | DROP     | `Aktif` / `TidakAktif` / `Pindah` / `Lulus` (default `Aktif`)   |

**Aturan:**

- Tahun ajaran = **tahun ajaran aktif** (perilaku sama dgn UI saat ini: `academicYearApi.list` → status `Aktif`). Kolom tahun ajaran opsional ditambahkan bila nanti ada kebutuhan multi-TA.
- Murid yg sudah terdaftar di jurusan tsb (TA aktif, status Aktif) → skip + catat.
- Murid yg terdaftar dgn status lama (mis. `Pindah`) di jurusan sama → reactivate.
- Simpan via `POST /batch` yang sudah ada.

### 4.3 Kelas Murid (`class-students`)

| Label Excel | Key         | Ket.     | Validasi                                                                                       |
| ----------- | ----------- | -------- | ---------------------------------------------------------------------------------------------- |
| Email Murid | `email`     | REQUIRED | Cocok dgn `shadow_students.email` (trim + lowercase; wajib ada)                                |
| Nama Kelas  | `className` | REQUIRED | Cocok dgn `shadow_classes.name`                                                                |
| Status      | `status`    | DROP     | `Aktif` / `TidakAktif` / `Naik Kelas` / `Tinggal Kelas` / `Pindah` / `Lulus` (default `Aktif`) |

**Aturan:**

- Sama seperti jurusan murid (TA aktif, duplicate-safe, reactivate).
- **Konsistensi jurusan:** jika murid sudah punya `major_students` aktif dan jurusannya ≠ jurusan kelas tujuan → baris **masuk `failedRows`** (implementasi mengikuti aturan bisnis service `create()`: "Jurusan murid tidak sesuai dengan jurusan kelas"), karena menyimpan murid dengan jurusan berbeda akan merusak konsistensi data kelas↔jurusan. Operator cukup memastikan urutan import: jurusan murid dulu, baru kelas murid.
- Simpan via `POST /batch` yang sudah ada (service `create()` per baris).

### 4.4 Matriks Alokasi Jam Pelajaran (`class-subject-requirements`) — 🥈 prioritas kedua

| Label Excel     | Key                | Ket.     | Validasi                                                                                                                         |
| --------------- | ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Nama Kelas      | `className`        | REQUIRED | Cocok dgn `shadow_classes.name`                                                                                                  |
| Kode Mapel      | `subjectCode`      | REQUIRED | Cocok dgn `shadow_subjects.code`                                                                                                 |
| Email Guru      | `email`            | REQUIRED | Cocok dgn `shadow_teachers.email` (trim + lowercase; wajib ada)                                                                  |
| JP Mingguan     | `weeklyHours`      | REQUIRED | integer ≥ 1                                                                                                                      |
| Max JP / Hari   | `maxHoursPerDay`   | OPT      | integer ≥ 1, default 2                                                                                                           |
| JP Batch        | `batchWeeklyHours` | OPT      | integer ≥ 0, default 0; **≤ weeklyHours**                                                                                        |
| Kode Grup Batch | `batchGroupId`     | OPT      | Jika kosong & `batchWeeklyHours > 0` → server bangkitkan otomatis 1 grup per (mapel+guru) utk semua kelas yg batch di upload ini |

**Aturan:**

- Simpan via `POST /batch` (`bulkUpsert`) yang **sudah ada** → validasi beban guru (`validateTeacherOverload`) & konsistensi batch (`validateBatchConsistency`) jalan otomatis; baris yg melanggar dilaporkan per-baris (wrap validasi per baris agar 1 error tidak membatalkan seluruh file).
- Perhatian: `bulkUpsert` saat ini memvalidasi seluruh array dlm satu transaksi. Untuk import, parse → validasi dulu baris per baris (mirip pola master) → baru kirim batch bersih. Baris melanggar masuk `failedRows` sebelum menyentuh DB.

### 4.5 Halangan Guru (`teacher-unavailabilities`) — 🥈 prioritas kedua

Format **long format** (1 baris = 1 slot terblokir), karena paling mudah diisi & paling cocok dgn struktur data:

| Label Excel | Key              | Ket.     | Validasi                                                        |
| ----------- | ---------------- | -------- | --------------------------------------------------------------- |
| Email Guru  | `email`          | REQUIRED | Cocok dgn `shadow_teachers.email` (trim + lowercase; wajib ada) |
| Hari        | `day`            | DROP     | `Senin`–`Sabtu` (sesuai `WORK_DAYS` konfigurasi)                |
| Jam ke-     | `lessonHourName` | REQUIRED | Cocok dgn `lesson_hours.name` (mis. "Jam 1")                    |

**Aturan:**

- Baris dikelompokkan per guru → panggil `bulkSet(teacherId, unavailabilities)` yang **sudah ada** (ganti seluruh halangan guru tsb — konsisten dgn perilaku "Simpan Halangan" di UI; jika ingin mode "tambah", tambah param `mode: 'append' | 'replace'`).
- Slot duplikat (hari+jam sama) dlm file → dedupe, catat.
- Guru tanpa halangan (tidak muncul di file) → halangannya **dikosongkan** hanya pada mode `replace`.

### 4.6 Jadwal Piket (`teacher-picket-schedules`)

| Label Excel | Key     | Ket.     | Validasi                                                        |
| ----------- | ------- | -------- | --------------------------------------------------------------- |
| Email Guru  | `email` | REQUIRED | Cocok dgn `shadow_teachers.email` (trim + lowercase; wajib ada) |
| Hari        | `day`   | DROP     | `Senin`–`Sabtu`                                                 |

**Aturan:**

- Simpan via `POST /batch` yang **sudah ada** (`createBulk`).
- Perilaku eksisting service: 1 guru = 1 hari; guru yg sudah punya piket di hari lain → baris masuk `failedRows` dgn reason pesan dari service (`Guru sudah memiliki jadwal piket di hari X`); hari sama → reactivate (dianggap sukses).

---

## 5. Perubahan Backend (`api-bn`) — file-by-file

> Semua mengikuti pola modul `master` (referensi: `src/master/src/modules/teacher/**`).

### 5.1 Persiapan bersama

1. **`src/master/src/middlewares/upload.middleware.ts`** — ekspor `uploadExcel` juga dari barrel `#app` (`src/app/index.ts`), agar modul academic & lain-lain bisa pakai tanpa import lintas modul. (Alternatif: pindahkan ke `src/app/middlewares/upload.middleware.ts` — lebih bersih, tetap satu sumber kebenaran.)
2. **`src/app/utils/excel.ts`** — tanpa perubahan (sudah lengkap).

### 5.2 Per modul (6× pola sama)

Untuk tiap modul, tambahkan di `controller`, `service`, `route`:

| Layer                        | Tambahan                                                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `service/*.service.ts`       | `getExcelTemplate(): Promise<Buffer>` (via `generateExcelTemplate` + konstanta `XXX_EXCEL_HEADERS` di file service) dan `bulkCreateFromExcel(buffer): Promise<{ createdItems, successCount, successRows, failedRows }>`     |
| `service/*.service.ts`       | konstanta `const XXX_EXCEL_HEADERS: HeaderSpec[] = [...]` (tabel §4)                                                                                                                                                        |
| `controller/*.controller.ts` | `downloadExcelTemplate = createDownloadTemplateHandler('<resource>_template.xlsx', () => service.getExcelTemplate())` dan `bulkCreateFromExcel = createUploadExcelHandler((buffer) => service.bulkCreateFromExcel(buffer))` |
| `route/*.route.ts`           | `get('/template', controller.downloadExcelTemplate)` dan `post('/batch/excel', uploadExcel, controller.bulkCreateFromExcel)`                                                                                                |

### 5.3 Khusus per modul

- **`subject-teachers`** (PRIORITAS): tambah `POST /batch` (controller `createBulk`, service `bulkCreate`, route) — saat ini belum ada; import Excel memanggilnya (atau service import menulis langsung, lebih efisien: 1 operasi).
- **`class-subject-requirements`**: `bulkCreateFromExcel` TIDAK memanggil `bulkUpsert` langsung; validasi dulu per baris di service import (kolom wajib, lookup class/subject/teacher, `batchWeeklyHours ≤ weeklyHours`, grup batch konsisten) → baru `bulkUpsert` utk baris valid.
- **`teacher-unavailabilities`**: service import mengelompokkan per guru → `bulkSet`; tambahkan opsi mode `replace` (default, konsisten UI) / `append`.
- **`major-students` & `class-students`**: lookup murid via `shadow_students` **berdasarkan `email`** (trim + lowercase); lookup referensi via `shadow_majors` / `shadow_classes`; tahun ajaran aktif diambil sekali per import. Email guru/murid di-`lowercase` saat membuat peta lookup (Map<email, id>) agar pencarian O(1) & konsisten.

### 5.4 Response API import (seragam)

```json
{
	"error": false,
	"statusCode": 201,
	"message": "Berhasil menambahkan data dari Excel",
	"data": {
		"successCount": 950,
		"failedCount": 50,
		"failedRows": [
			{
				"email": "guru.1@example.com",
				"subjectCode": "MTK",
				"reason": "Guru dengan email guru.1@example.com tidak ditemukan"
			}
		]
	}
}
```

---

## 6. Perubahan Frontend (`akademik-bn`) — file-by-file

### 6.1 Helper baru di `src/lib/services/base.ts`

```ts
// Upload file Excel → endpoint /batch/excel (FormData, field "file")
export async function uploadExcel<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
	const fd = new FormData();
	fd.append('file', file);
	const res = await apiClient(endpoint, { method: 'POST', body: fd });
	return parseResponse<T>(res);
}

// Download template → simpan ke disk (auth via apiClient yang sudah handle token)
export async function downloadExcel(endpoint: string, filename: string): Promise<void> {
	const res = await apiClient(endpoint);
	if (!res.ok) throw parseResponse(res); // parseResponse melempar Error dgn message
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
```

### 6.2 Komponen reusable: `src/lib/components/molecules/excel-import.svelte`

Props (agar 1 komponen dipakai 6 halaman):

```ts
{
  templateEndpoint: string;      // GET /academic/{resource}/template
  templateFilename: string;      // mis. "subject_teachers_template.xlsx"
  uploadEndpoint: string;        // POST /academic/{resource}/batch/excel
  serviceLabel: string;          // mis. "Guru Mapel"
  onSuccess?: () => void;        // refresh data halaman
}
```

Fitur UI (sesuai gaya neobrutal DESAIN.md):

- Tombol **"Download Template"** (icon `download`) → `downloadExcel(...)`.
- Area drop-zone `input type="file" accept=".xlsx,.xls"` + drag & drop (opsional fase 2).
- Saat upload: state `isUploading`, progress text.
- Panel hasil: banner hijau `N baris berhasil` / merah `M baris gagal`; tabel baris gagal (data + reason, scroll max-h) + tombol "Unduh Laporan Gagal (.csv)" (opsional).
- Semua dalam `Modal` neobrutal (`neo-border`, `neo-shadow`).

### 6.3 Pemasangan per halaman

| Halaman         | File                                                                 | Endpoint template/upload                   | Letak tombol                                                            |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| Guru Mapel      | `src/routes/(app)/subject/+page.svelte` (halaman luar/daftar)        | `/academic/subject-teachers/...`           | kanan atas daftar mapel; halaman detail pakai bulk insert per mapel     |
| Jurusan Murid   | `src/routes/(app)/major-students/+page.svelte` (halaman luar/daftar) | `/academic/major-students/...`             | kanan atas daftar jurusan; halaman detail pakai bulk insert per jurusan |
| Kelas Murid     | `src/routes/(app)/class-students/+page.svelte` (halaman luar/daftar) | `/academic/class-students/...`             | kanan atas daftar kelas; halaman detail pakai bulk insert per kelas     |
| Matriks Alokasi | `src/routes/(app)/lesson-schedule/generator/+page.svelte` (Tab 1)    | `/academic/class-subject-requirements/...` | header Tab 1, di samping "Buat Mapping Baru"                            |
| Halangan Guru   | `src/routes/(app)/lesson-schedule/generator/+page.svelte` (Tab 2)    | `/academic/teacher-unavailabilities/...`   | header Tab 2                                                            |
| Jadwal Piket    | `src/routes/(app)/schedule/+page.svelte`                             | `/academic/teacher-picket-schedules/...`   | toolbar atas                                                            |

> **Penempatan:** tombol upload untuk **Guru Mapel, Jurusan Murid, Kelas Murid** diletakkan di **halaman luar (daftar)** — template-nya sudah membawa kolom referensi (`Kode Mapel` / `Kode Jurusan` / `Nama Kelas`) sehingga konteks tidak diperlukan. Halaman detail cukup memakai **bulk insert** yang sudah ada (pilih banyak guru/murid untuk mapel/jurusan/kelas terpilih). Matriks Alokasi, Halangan Guru, dan Jadwal Piket tetap di halaman masing-masing.

Setelah sukses, panggil `onSuccess` → reload data (fungsi fetch yang sudah ada per halaman: `fetchTeachers()`, `fetchStudents()`, `loadRequirementsForClass()`, `loadTeacherUnavailabilities()`, `loadSchedule()`).

### 6.4 Service objects frontend

Tambahkan method `downloadTemplate()` & `uploadFromExcel(file)` ke object service yang bersangkutan (`teacher.service.ts` → `subjectTeachers`, `major.service.ts` → `majorStudents`, `class.service.ts` → `classStudents`, `timetable-generator.service.ts` → `classSubjectRequirementApi` & `teacherUnavailabilityApi`, `schedule.service.ts` → `scheduleApi`) — memakai helper §6.1.

---

## 7. Fitur Pendukung (opsional, fase lanjut)

1. **Export data existing ke Excel** (bukan cuma template kosong): tombol "Unduh Data" yg meng-export data saat ini via `generateExcelTemplate` + isi baris — sangat membantu verifikasi & backup.
2. **Validasi kolom referensi di UI**: saat pilih file, frontend pre-validate baris (email guru/murid atau kode tidak dikenal) pakai data shadow yang sudah dimuat — mengurangi round-trip ke server. (Server tetap sumber kebenaran.)
3. **Drag & drop + paste dari clipboard** di drop-zone.
4. **Riwayat upload** (siapa, kapan, jumlah sukses/gagal) — log audit.
5. **Template multi-sheet** untuk halangan guru (1 sheet per guru / format matriks hari×jam) — ditunda, long format sudah cukup.
6. **Upload dalam konteks tahun ajaran**: kolom opsional `Kode Tahun Ajaran` di template jurusan/kelas murid (saat ini TA aktif saja).

---

## 8. Fase Implementasi & Prioritas

| Fase                                            | Scope                                                                                                         | Alasan urutan                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 — Prasyarat**                          | Ekspor `uploadExcel` ke `#app`; helper frontend `uploadExcel`/`downloadExcel`; komponen `excel-import.svelte` | Semua fase lain bergantung padanya                                                                                          |
| **Fase 1 — Guru Mapel** 🥇                      | `subject-teachers`: template + import + `POST /batch` baru + UI di `/subject/[id]`                            | Concern utama user; paling sering dipakai; pola paling sederhana (lookup email + kode mapel) → jadi "pilot" untuk fase lain |
| **Fase 2 — Matriks Alokasi + Halangan Guru** 🥈 | `class-subject-requirements` & `teacher-unavailabilities` di halaman generator                                | Bagian inti generator jadwal; paling berat manualnya; masuk satu halaman sehingga hemat effort                              |
| **Fase 3 — Jurusan & Kelas Murid**              | `major-students` & `class-students` di halaman detail                                                         | Lookup murid per-email; volume data besar tetapi logika sederhana (pakai `POST /batch` eksisting)                           |
| **Fase 4 — Jadwal Piket + polish**              | `teacher-picket-schedules`; export data, drag & drop, laporan gagal CSV                                       | Volume kecil; sisa polish fitur pendukung                                                                                   |

Setiap fase **independen** & bisa di-deploy sendiri. Mulai produksi setelah Fase 1 diuji end-to-end.

---

## 9. Checklist Implementasi & Validasi

### Backend (`api-bn`)

- [ ] `uploadExcel` tersedia dari `#app` (barrel)
- [ ] 6 modul punya `GET /template` + `POST /batch/excel`
- [ ] `subject-teachers` punya `POST /batch` (bulk create)
- [ ] Service import tiap modul: per-baris validation + `failedRows` + duplicate-safe
- [ ] Validasi tipe: `npx tsc --noEmit` (di repo api-bn; bandingkan error pre-existing)
- [ ] Smoke test manual per modul: template terunduh → isi 3 baris (1 benar, 1 duplikat, 1 salah lookup) → upload → cek laporan & DB

### Frontend (`akademik-bn`)

- [ ] `uploadExcel`/`downloadExcel` di `base.ts`
- [ ] Komponen `excel-import.svelte` terpasang di 6 halaman
- [ ] `npm run check` (svelte-check) → 0 error
- [ ] `npm run lint` + `npm run format`
- [ ] Browser test: download template, upload, tampil laporan, halaman refresh

### Dokumentasi

- [ ] Update `docs/academic_precision/DESIGN.md` (jika perlu)
- [ ] Update README fitur (bagian data input)

---

## 10. Risiko & Mitigasi

| Risiko                                                          | Mitigasi                                                                                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File besar (ribuan baris) melebihi limit / timeout              | Multer limit 5 MB sudah ada; optimasi: batch insert per 500 baris; import jalan dlm request normal (data mapping kecil, bukan master)                                            |
| Email ganda / duplikat dlm file (guru/murid sama muncul 2×)     | Normalisasi email (trim + lowercase) lalu dedupe; baris duplikat masuk `failedRows` dengan alasan jelas                                                                          |
| `bulkUpsert` class-subject-requirements validasi-all-or-nothing | Service import memvalidasi per baris TERLEBIH DAHULU (reuse aturan `validateBatchConsistency`/`validateTeacherOverload` yg di-refactor ke fungsi ekspos), baru kirim batch valid |
| Halangan guru mode replace menghapus data tak sengaja           | Default `replace` konsisten dgn UI; tampilkan konfirmasi di modal ("Akan mengganti seluruh halangan guru yang muncul di file"); opsi `append` sebagai alternatif                 |
| Perilaku piket 1 guru = 1 hari                                  | Sudah ditangani service `create`; baris konflik masuk laporan                                                                                                                    |
| User tidak paham template                                       | Template berisi sample row + dropdown validasi + kolom label Indonesia; hint di komponen UI ("Download template lalu isi baris berikutnya")                                      |

---

## 11. Best Practices (diwarisi dari plan & DESAIN.md)

1. **Jangan bangun ulang** — pakai `parseExcel`/`generateExcelTemplate`/helper controller/`uploadExcel` yang sudah ada di api-bn.
2. **Per-baris validation** (pola `successRows`/`failedRows` modul master) — bukan all-or-nothing.
3. **Duplicate-safe & idempotent** — import 2× tidak menggandakan data; baris sama = skip/reactivate.
4. **Label Indonesia, key kanonik** — `HeaderSpec { label, key }` + `buildHeaderLabelMap` (roundtrip konsisten antara template & parser).
5. **Determinisme** — sort sebelum iterasi; lookup selalu via key unik.
6. **Validasi berlapis** — kolom wajib (parseExcel) → lookup referensi (service) → endpoint batch eksisting (validasi bisnis) → laporan UI.
7. **Testing tanpa infra test** — gunakan smoke test manual (template → isi → upload → verifikasi) seperti yang dilakukan pada fitur batch teaching; pertimbangkan vitest untuk unit test pure service import bila infra test ditambahkan.
