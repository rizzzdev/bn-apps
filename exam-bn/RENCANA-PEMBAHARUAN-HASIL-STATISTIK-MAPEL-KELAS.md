# Rencana Pembaruan Hasil Ujian & Statistik Berbasis Mapel dan Kelas

## 1. Tujuan

Memperbarui fitur **Hasil Ujian** dan **Statistik Ujian** agar dapat dianalisis berdasarkan data akademik yang sekarang sudah tersedia di exam service:

- Mapel dari `Exam.subjectId` → `ShadowSubject`
- Kelas dari `ExamRoomClass.classId` → `ShadowClass`
- Peserta dan alokasi guru soal dari `ExamParticipant.teacherId`
- Jadwal/mapping akademik dari `ShadowTeachingSchedule`

Hasil akhir harus mendukung:

1. filter hasil/statistik berdasarkan mapel;
2. filter berdasarkan kelas;
3. kombinasi filter mapel + kelas + ujian + rentang waktu;
4. tampilan nama mapel dan kelas, bukan hanya ID;
5. export Excel dengan kolom mapel dan kelas;
6. data lama tetap dapat ditampilkan tanpa kehilangan hasil ujian.

---

## 2. Hasil Audit Saat Ini

### 2.1 Frontend `exam-bn`

Halaman yang terlibat:

- `src/routes/admin/results/+page.ts`
- `src/routes/admin/results/+page.svelte`
- `src/routes/admin/statistics/+page.ts`
- `src/routes/admin/statistics/+page.svelte`
- `src/routes/supervisor/results/+page.ts`
- `src/routes/supervisor/results/+page.svelte`
- `src/routes/supervisor/statistics/+page.ts`
- `src/routes/supervisor/statistics/+page.svelte`
- `src/routes/admin/results/[examRoomId]/answers/[userId]/+page.ts`
- `src/routes/supervisor/results/[examRoomId]/answers/[userId]/+page.ts`
- `src/lib/types/index.ts`
- `src/lib/utils/export.ts`

Kondisi sekarang:

- halaman mengambil semua ujian, ruangan, user, peserta, dan score;
- data hasil/statistik dikumpulkan dengan banyak request per `examRoom`;
- agregasi dilakukan di browser;
- hasil admin menggabungkan peserta berdasarkan `userId` sehingga konteks kelas/ruangan dapat hilang jika peserta muncul di lebih dari satu ruangan;
- statistik belum memiliki filter mapel/kelas;
- export belum memiliki kolom mapel dan kelas;
- nama mapel dan kelas belum menjadi bagian standar dari data hasil.

### 2.2 API service `api-bn/src/exam`

Model yang sudah tersedia:

- `Exam.subjectId`
- `ExamRoomClass.classId`
- `ExamParticipant.examRoomId`
- `ExamParticipant.userId`
- `ExamParticipant.teacherId`
- `ExamScore.examRoomId`
- `ExamScore.userId`
- `ShadowSubject`
- `ShadowClass`
- `ShadowClassStudent`
- `ShadowTeachingSchedule`

Kondisi sekarang:

- `exam-score` hanya menyediakan CRUD/filter `examRoomId` dan `userId`;
- belum ada modul report/statistics server-side;
- belum ada endpoint agregasi berdasarkan `subjectId` atau `classId`;
- `ExamScore` tidak menyimpan dimensi mapel/kelas secara langsung, sehingga report harus melakukan join melalui `ExamRoom → Exam` dan `ExamParticipant/ExamRoomClass`;
- `ExamParticipant` belum menyimpan snapshot `classId`;
- kelas peserta saat ini harus diturunkan dari shadow membership yang dapat berubah di kemudian hari;
- endpoint directory sudah tersedia:
  - `GET /exam/subjects`
  - `GET /exam/classes`
  - `GET /exam/teacher-subjects`
  - `GET /exam/teaching-schedules`

---

## 3. Keputusan Desain yang Direkomendasikan

### 3.1 Agregasi dipindahkan ke API

Jangan melanjutkan pola N+1 request dan agregasi utama di frontend.

API menyediakan report teragregasi sehingga:

- query lebih efisien;
- pagination/filter konsisten;
- hasil admin dan supervisor memakai definisi metrik yang sama;
- akses data dapat divalidasi di server;
- export dapat memakai data yang sama dengan tampilan.

Frontend hanya bertanggung jawab untuk:

- memilih filter;
- menampilkan hasil response API;
- visualisasi;
- export response menjadi Excel.

### 3.2 Mapel memakai `Exam.subjectId`

Tidak perlu menambahkan `subjectId` baru ke `ExamRoom`, `ExamParticipant`, atau `ExamScore` karena mapel ujian sudah ditentukan oleh `Exam.subjectId`.

Report mengambil:

```text
ExamScore
  → ExamRoom
  → Exam
  → Exam.subjectId
  → ShadowSubject
```

Untuk ujian lama tanpa mapel:

- `subjectId = null`;
- ditampilkan sebagai **Mapel Tidak Ditentukan**;
- tetap masuk hasil/statistik global;
- dapat difilter melalui pilihan khusus `Tanpa Mapel`.

### 3.3 Menambahkan snapshot kelas pada peserta

Tambahkan kolom nullable pada `ExamParticipant`:

```text
classId String? @map("class_id")
```

Alasan:

- membership siswa pada `ShadowClassStudent` dapat berubah;
- hasil ujian harus merepresentasikan kelas saat ujian berlangsung;
- `ExamRoomClass` hanya menyatakan kelas yang dialokasikan ke ruangan, bukan kelas pasti setiap peserta;
- satu ruangan dapat memiliki lebih dari satu kelas.

Saat peserta ditambahkan:

1. ambil kelas aktif siswa dari `ShadowClassStudent`;
2. cocokkan dengan kelas aktif pada `ExamRoomClass`;
3. simpan `classId` yang cocok ke `ExamParticipant`.

Jika:

- tidak ditemukan kelas yang cocok → `classId = null`;
- ditemukan lebih dari satu kelas → jangan menebak secara diam-diam; API mengembalikan warning/error yang jelas atau membutuhkan `classId` eksplisit dari admin;
- ujian lama → `classId` dapat tetap null sampai proses backfill berhasil.

> Rekomendasi awal: tambahkan `classId` nullable dan lakukan backfill best-effort. Data yang ambigu tidak boleh dipindahkan secara otomatis ke kelas yang salah.

### 3.4 Sumber kebenaran assignment guru soal

Untuk report guru:

```text
ExamParticipant.teacherId
```

bukan lagi `ExamRoomClass.teacherId`, karena assignment soal sekarang murni per individu.

Dimensi guru dapat digunakan sebagai filter tambahan pada fase berikutnya, tetapi scope utama plan ini adalah mapel dan kelas.

---

## 4. Perubahan API `api-bn`

### 4.1 Prisma schema dan migration

File:

- `src/exam/prisma/schema.prisma`
- migration baru, misalnya:
  - `20260807_add_participant_class_snapshot`

Perubahan:

1. tambah `ExamParticipant.classId String?`;
2. tambah index gabungan yang mendukung report:
   - `[classId]`;
   - `[examRoomId, classId]`;
   - bila diperlukan `[teacherId]`;
3. pertahankan seluruh kolom lama;
4. tidak menghapus data existing.

Backfill:

- cocokkan participant ke `ShadowStudent.userId`;
- ambil `ShadowClassStudent` aktif;
- batasi class ke `ExamRoomClass` pada room yang sama;
- jika hanya satu kandidat, isi `classId`;
- jika 0 atau lebih dari 1 kandidat, biarkan null dan catat jumlah ambiguity untuk audit.

### 4.2 Perbarui create participant

Modul:

- `exam-participant.schema.ts`
- `exam-participant.service.ts`
- `exam-participant.repository.ts`
- endpoint bulk/add participant bila ada

Payload yang direkomendasikan:

```json
{
	"examRoomId": "...",
	"userId": "...",
	"classId": "..."
}
```

`classId` boleh nullable untuk backward compatibility, tetapi API harus memvalidasi bahwa class tersebut memang dialokasikan pada `ExamRoom`.

Jika `classId` tidak dikirim, service mencoba melakukan resolusi otomatis dari shadow membership.

### 4.3 Modul report baru

Buat modul terpisah agar tidak mencampur query report dengan CRUD `exam-score`, misalnya:

```text
src/exam/src/modules/exam-report/
  exam-report.query.ts
  exam-report.schema.ts
  exam-report.repository.ts
  exam-report.service.ts
  exam-report.controller.ts
  exam-report.routes.ts
```

Daftarkan pada `src/exam/src/routes/index.ts`.

#### Endpoint hasil

```http
GET /exam/reports/results
```

Filter yang disediakan:

- `subjectId`
- `classId`
- `examId`
- `examRoomId`
- `teacherId` (opsional, terutama untuk supervisor)
- `from`
- `to`
- `page`
- `limit`

Response minimal:

```ts
{
  items: [
    {
      examId: string;
      examName: string;
      subjectId: string | null;
      subjectName: string | null;
      examRoomId: string;
      roomName: string;
      classId: string | null;
      className: string | null;
      participantId: string;
      userId: string;
      fullname: string;
      email: string | null;
      teacherId: string | null;
      score: number | null;
      passed: boolean | null;
      submitted: boolean;
      status: 'SUBMITTED' | 'PENDING_GRADE' | 'NOT_SUBMITTED';
    }
  ];
  pagination: { page: number; limit: number; total: number };
}
```

Catatan: hasil sebaiknya berbasis baris **peserta dalam room**, bukan deduplikasi global berdasarkan `userId`, agar kelas dan ruangan tidak hilang.

#### Endpoint statistik

```http
GET /exam/reports/statistics
```

Filter sama dengan endpoint hasil.

Response minimal:

```ts
{
  summary: {
    totalExams: number;
    totalRooms: number;
    totalParticipants: number;
    submitted: number;
    scored: number;
    pendingGrade: number;
    notSubmitted: number;
    passed: number;
    failed: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    passRate: number | null;
  };
  groups: [
    {
      examId: string;
      examName: string;
      subjectId: string | null;
      subjectName: string | null;
      classId: string | null;
      className: string | null;
      totalParticipants: number;
      submitted: number;
      scored: number;
      pendingGrade: number;
      notSubmitted: number;
      passed: number;
      failed: number;
      average: number | null;
      minimum: number | null;
      maximum: number | null;
      passRate: number | null;
      buckets: { label: string; count: number }[];
    }
  ];
}
```

#### Endpoint opsi filter

Gunakan directory endpoint yang sudah ada untuk opsi mapel dan kelas. Bila diperlukan untuk menghindari beberapa request, tambahkan endpoint:

```http
GET /exam/reports/filter-options
```

Response:

- subjects;
- classes yang pernah digunakan pada exam room;
- exams yang sesuai hak akses user;
- teachers pembuat soal yang relevan.

### 4.4 Query dan performa

Query report harus:

- memakai join/filter di database, bukan loop request per room;
- memperhitungkan `deletedAt` pada shadow dan exam records;
- membatasi data berdasarkan hak akses sebelum agregasi;
- menggunakan `COUNT`, `AVG`, `MIN`, `MAX`, dan conditional aggregation bila memungkinkan;
- tidak menganggap peserta yang belum memiliki `ExamScore` sebagai data yang hilang;
- membedakan:
  - tidak hadir/tidak submit;
  - sudah submit tetapi belum dinilai;
  - sudah dinilai.

Tambahkan/validasi index pada:

- `Exam.subjectId`;
- `ExamRoom.examId`;
- `ExamRoomClass.examRoomId, classId`;
- `ExamParticipant.examRoomId, classId`;
- `ExamParticipant.examRoomId, userId`;
- `ExamScore.examRoomId, userId`;
- `ShadowClassStudent.classId, studentId`.

### 4.5 Hak akses

Admin/super admin:

- dapat melihat seluruh mapel, kelas, ujian, dan hasil yang diizinkan oleh role saat ini;
- dapat menggunakan semua filter.

Supervisor/guru:

- hanya melihat ujian yang saat ini memang dapat diakses oleh helper `filterCreatorExams`/`isExamQuestionCreator`;
- filter mapel dibatasi pada mapel yang diajarnya atau yang menjadi pembuat soal;
- filter kelas dibatasi pada kelas yang muncul pada hasil ujian yang dapat diakses.

Keputusan yang perlu dikonfirmasi sebelum implementasi penuh:

- apakah guru melihat seluruh peserta pada ujian yang ia buat, atau hanya peserta dengan `ExamParticipant.teacherId = userId`;
- rekomendasi: untuk ujian baru, guru hanya melihat peserta yang diarahkan ke dirinya; ujian legacy/shared tetap mengikuti perilaku lama.

---

## 5. Perubahan Frontend `exam-bn`

### 5.1 Types

Perbarui `src/lib/types/index.ts` dengan tipe:

- `ExamResultRow`;
- `ExamStatisticsSummary`;
- `ExamStatisticsGroup`;
- `ReportFilters`;
- pagination response;
- `classId` pada `ExamParticipant`;
- `subjectName`/`className` pada response report, bukan memaksa field tersebut ke model database mentah.

### 5.2 Shared filter component/helper

Buat komponen/helper reusable, misalnya:

```text
src/lib/components/results/ReportFilters.svelte
src/lib/utils/report-filters.ts
```

Kontrol:

- Mapel;
- Kelas;
- Ujian;
- rentang waktu bila diperlukan;
- tombol reset filter.

Gunakan komponen UI yang sudah ada:

- `Select` / `CustomSelect`;
- `Button`;
- `Badge`;
- `Input`.

### 5.3 Admin Results

Perbarui:

- `src/routes/admin/results/+page.ts`
- `src/routes/admin/results/+page.svelte`

Perubahan:

1. ganti N+1 API calls dengan `GET /exam/reports/results`;
2. tambahkan filter mapel dan kelas;
3. tampilkan kolom:
   - Ujian;
   - Mapel;
   - Kelas;
   - Ruangan;
   - Peserta;
   - Nilai;
   - Status;
4. pertahankan detail jawaban per `examRoomId + userId`;
5. jangan dedupe peserta lintas kelas/ruangan;
6. tambahkan subject/class ke export.

### 5.4 Admin Statistics

Perbarui:

- `src/routes/admin/statistics/+page.ts`
- `src/routes/admin/statistics/+page.svelte`

Perubahan:

1. gunakan endpoint statistics server-side;
2. summary cards mengikuti filter aktif;
3. tambahkan breakdown per:
   - mapel;
   - kelas;
   - ujian;
4. histogram mengikuti subset data aktif;
5. tampilkan state khusus:
   - belum ada mapel;
   - kelas tidak diketahui;
   - belum ada peserta;
6. export summary memuat Mapel dan Kelas.

### 5.5 Supervisor Results dan Statistics

Perbarui:

- `src/routes/supervisor/results/+page.ts`
- `src/routes/supervisor/results/+page.svelte`
- `src/routes/supervisor/statistics/+page.ts`
- `src/routes/supervisor/statistics/+page.svelte`

Perubahan:

- tetap gunakan access filtering yang ada;
- tambahkan filter mapel/kelas yang hanya berisi opsi terotorisasi;
- tampilkan nama mapel dan kelas;
- terapkan filter `teacherId` sesuai keputusan akses;
- pertahankan export per guru dan export semua data yang boleh dilihat.

### 5.6 Detail hasil peserta

Perbarui halaman:

- `src/routes/admin/results/[examRoomId]/answers/[userId]/+page.ts`
- `src/routes/supervisor/results/[examRoomId]/answers/[userId]/+page.ts`
- file Svelte terkait.

Tambahkan metadata:

- nama ujian;
- mapel;
- kelas snapshot peserta;
- ruangan;
- guru soal peserta jika tersedia.

Jangan mengubah cara pengambilan question set peserta; tetap gunakan resolver per individu berbasis `ExamParticipant.teacherId`.

---

## 6. Export Excel

### Hasil per peserta

Tambahkan kolom:

1. No;
2. Nama Ujian;
3. Mapel;
4. Kelas;
5. Ruangan;
6. Nama Peserta;
7. Email;
8. Guru Soal;
9. Nilai;
10. Status;
11. KKM;
12. Waktu ujian.

### Statistik

Tambahkan kolom:

- Mapel;
- Kelas;
- Ujian;
- Jumlah peserta;
- Submit;
- Sudah dinilai;
- Belum dinilai;
- Tidak hadir;
- Lulus;
- Tidak lulus;
- Rata-rata;
- Minimum;
- Maksimum;
- Persentase kelulusan.

Nama file harus mencerminkan filter aktif, contohnya:

```text
hasil_bahasa-indonesia_kelas-7a.xlsx
statistik_semua-mapel.xlsx
```

---

## 7. Backward Compatibility

### Ujian lama tanpa mapel

- tetap tampil di hasil dan statistik;
- tampilkan `Mapel Tidak Ditentukan`;
- tetap masuk summary global;
- filter `Tanpa Mapel` tersedia.

### Peserta lama tanpa snapshot kelas

- tetap tampil;
- tampilkan `Kelas Tidak Diketahui`;
- tidak dipaksa masuk kelas berdasarkan data membership yang ambigu;
- backfill hanya mengisi record yang hasilnya unambiguous.

### Score lama

- tidak mengubah tabel `ExamScore` secara destruktif;
- score tetap di-resolve melalui `ExamRoom` dan `ExamParticipant`;
- hasil lama tetap dapat dibuka melalui detail jawaban.

### Soal shared dan teacher ownership lama

- `teacherId = null` tetap dianggap shared sesuai perilaku legacy;
- akses supervisor lama tidak boleh tiba-tiba hilang;
- report membedakan data legacy dan data dengan assignment guru baru bila diperlukan.

---

## 8. Tahapan Implementasi

### Fase 1 — Finalisasi kontrak report

- sepakati bentuk response results/statistics;
- sepakati definisi status, pass rate, pending grade, dan tidak hadir;
- sepakati apakah guru hanya melihat peserta yang `teacherId`-nya sama;
- sepakati perlakuan peserta multi-kelas dan data ambiguity.

### Fase 2 — Snapshot kelas peserta

- tambah `ExamParticipant.classId` nullable;
- migration;
- backfill aman;
- update create/add participant;
- update type dan response.

### Fase 3 — API report/statistics

- buat modul `exam-report`;
- buat query filter dan access control;
- buat endpoint results;
- buat endpoint statistics;
- tambahkan index/query optimization;
- tambahkan unit/integration test untuk filter mapel, kelas, legacy, dan multi-room.

### Fase 4 — Frontend shared filters dan types

- tambah types report;
- buat `ReportFilters.svelte`;
- buat helper label mapel/kelas/status;
- buat state filter yang dapat dipakai admin dan supervisor.

### Fase 5 — Migrasi halaman Results

- admin results;
- supervisor results;
- detail result metadata;
- export result.

### Fase 6 — Migrasi halaman Statistics

- admin statistics;
- supervisor statistics;
- summary, breakdown, histogram;
- export statistics.

### Fase 7 — Validasi dan rollout

- API typecheck;
- frontend `svelte-check`;
- lint;
- test query/report dengan data legacy dan data baru;
- browser test filter mapel/kelas;
- verifikasi hak akses admin/supervisor;
- jalankan migration deploy tanpa reset database;
- dokumentasikan perubahan endpoint dan cara rollback.

---

## 9. Skenario Penerimaan

### Skenario A — Filter mapel

Admin memilih Mapel Bahasa Indonesia.

- hanya ujian Bahasa Indonesia tampil;
- summary/statistik hanya menghitung subset tersebut;
- export hanya berisi subset tersebut.

### Skenario B — Filter kelas

Admin memilih Kelas 7A.

- hanya peserta dengan snapshot `classId = 7A` tampil;
- peserta dari 7B tidak ikut rata-rata/pass rate;
- hasil multi-room tetap tidak terduplikasi secara salah.

### Skenario C — Kombinasi mapel dan kelas

Admin memilih Bahasa Indonesia + 7A.

- hanya hasil peserta 7A untuk ujian Bahasa Indonesia tampil;
- histogram dan rata-rata mengikuti subset kombinasi tersebut.

### Skenario D — Ujian PABP dengan guru soal per individu

- mapel PABP tampil sebagai satu mapel;
- peserta tetap dapat dikelompokkan berdasarkan kelas;
- guru soal peserta tersedia sebagai metadata/filter opsional;
- score peserta tidak tercampur dengan peserta yang diarahkan ke guru lain.

### Skenario E — Legacy

Ujian lama tanpa `subjectId` dan peserta tanpa `classId`:

- tetap tampil di hasil/statistik;
- diberi label `Mapel Tidak Ditentukan` / `Kelas Tidak Diketahui`;
- tidak menyebabkan error atau hilangnya data.

---

## 10. Risiko dan Mitigasi

| Risiko                                           | Mitigasi                                                |
| ------------------------------------------------ | ------------------------------------------------------- |
| Query report lambat                              | Agregasi server-side, index, pagination, hindari N+1    |
| Kelas siswa berubah setelah ujian                | Snapshot `classId` pada `ExamParticipant`               |
| Siswa punya lebih dari satu kelas                | Validasi ambiguity; jangan menebak otomatis             |
| Data legacy tidak punya mapel/kelas              | Nullable field + label fallback                         |
| Supervisor melihat data guru lain                | Access control server-side dan filter `teacherId`       |
| Definisi submitted berbeda dengan status peserta | Tetapkan kontrak status berdasarkan participant + score |
| Export tidak sesuai filter                       | Export memakai dataset/filter response yang sama        |
| Migration mengganggu data lama                   | Migration additive, nullable, deploy tanpa reset        |

---

## 11. Rekomendasi Urutan Keputusan

Sebelum implementasi, konfirmasi tiga keputusan berikut:

1. **Snapshot kelas:** gunakan `ExamParticipant.classId` nullable dan backfill hanya data yang unambiguous — direkomendasikan.
2. **Visibilitas guru:** guru hanya melihat peserta yang diarahkan ke dirinya pada ujian baru, atau seluruh peserta ujian yang ia buat — direkomendasikan: hanya peserta miliknya untuk data baru, legacy tetap seperti sekarang.
3. **Granularitas hasil:** baris hasil menggunakan peserta-per-room, bukan dedupe global berdasarkan user — direkomendasikan.

Setelah tiga keputusan ini disetujui, implementasi dapat dimulai dari migration snapshot kelas dan kontrak endpoint report.
