# Rencana Perombakan Fitur Ujian — Berbasis Mata Pelajaran (Mapel)

> Status: **Draf v3 — keputusan dikunci**
>
> - **Frontend**: repo `exam-bn` (SvelteKit).
> - **API**: repo `api-bn`, service **`src/exam`** (TypeScript + Express + Prisma) — **ikut diubah**.
> - **Master data** sudah tersedia di service lain: `Subject` (master), `SubjectTeacher` & `ClassSubjectRequirement` (academic) → disinkron ke DB exam sebagai shadow data.
> - Guru soal per kelas **dipilih manual oleh admin** (jadwal hanya default).
> - Kelas tanpa guru soal → **siswanya tidak dapat soal**.

---

## 1. Ringkasan

Ujian saat ini terikat ke **satu guru pembuat soal** (`Exam.questionCreatorId`) dan soal dihubungkan ke **setiap ruang ujian** (`ExamQuestion.examRoomId`). Semua siswa dalam satu ruang mendapat set soal yang sama.

Perombakan mengubah model menjadi **berbasis mata pelajaran**:

| Konsep                      | Sebelum                            | Sesudah                                                                            |
| --------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Ujian                       | punya `questionCreatorId` (1 guru) | punya **`subjectId` (mapel)** — wajib                                              |
| Pembuat soal                | 1 guru dipilih admin               | **Semua guru yang mengajar mapel itu** (dari `SubjectTeacher`)                     |
| Assign kelas di ruang ujian | semua kelas tampil                 | hanya kelas yang diajar guru pengampu mapel; admin **memilih guru soal per kelas** |
| Soal per siswa              | semua soal ruang itu               | soal dari **guru yang dipilih admin untuk kelas siswa**                            |

Contoh kasus nyata:

- Ujian **"UTS Bahasa Indonesia"** → mapel **Bahasa Indonesia**.
- Guru pengampu Bahasa Indonesia: **Bu Sari** (kelas 7A, 7B) dan **Pak Budi** (kelas 8A).
- Keduanya otomatis menjadi pembuat soal ujian ini (set soal masing-masing).
- Saat admin mengalokasikan ruangan: default kelas 7A/7B → soal Bu Sari, 8A → soal Pak Budi; admin **bisa mengubah** per kelas.

---

## 2. Kondisi Saat Ini

### 2.1 Frontend (`exam-bn`)

```
Exam      { id, name, questionCreatorId?, startTime, endTime, mcWeight, essayWeight, passingGrade }
ExamRoom  { id, examId, roomId, status, examRoomClasses: [{ classId }] }
ExamQuestion { id, examRoomId, questionId, questionNumber }
User      { id, fullname, email, role, className? }
```

Alur: admin buat ujian (pilih 1 pembuat soal) → alokasi ruang + kelas → tambah peserta → guru (pembuat soal) buat soal → soal dilampirkan ke semua ruang → siswa melihat semua soal ruangnya.

### 2.2 API (`api-bn/src/exam`)

Arsitektur: Express + Prisma, satu DB terpisah per service. Pola modul:

```
modules/<nama>/<nama>.{routes,controller,service,repository,schema,types,interface,query}.ts
```

Route di-mount di `src/exam/src/routes/index.ts` dengan prefiks `/api/v1/exam` (`/exams`, `/exam-rooms`, `/exam-questions`, `/classes`, `/users`, ...).

Model Prisma saat ini (`src/exam/prisma/schema.prisma`) yang relevan:

```prisma
model Exam         { id, questionCreatorId?, name, ..., examRooms ExamRoom[] }
model ExamRoom     { id, examId, roomId, status, examRoomClasses ExamRoomClass[] }
model ExamRoomClass{ id, examRoomId, classId }   // @@unique([examRoomId, classId])
model ExamQuestion { id, examRoomId, questionId, questionNumber } // @@unique([examRoomId, questionId])
model Question     { id, text, type, options[], correctAnswer? }
```

Sudah ada **shadow models** yang disinkron dari master/academic (`ShadowTeacher`, `ShadowClass`, `ShadowClassStudent`, `ShadowStudent`) lewat `services/shadow-sync.service.ts` yang membaca DB master/academic langsung (via `orchestrator`) lalu di-`lazySyncAll()` per 60 detik.

Catatan penting: schema exam memakai `z.strictObject` → **field asing (mis. `subjectId`) langsung ditolak backend saat ini**. Ini alasan utama API ikut diubah.

### 2.3 Master data yang SUDAH ada (dipakai, tidak dibuat baru)

| Data                         | Service  | Model                                                              | Keterangan                  |
| ---------------------------- | -------- | ------------------------------------------------------------------ | --------------------------- |
| Mapel                        | master   | `Subject` (id, code, name)                                         | sudah ada                   |
| Guru mengajar mapel          | academic | `SubjectTeacher` (teacherId, subjectId, status)                    | sudah ada                   |
| Guru mengajar mapel di kelas | academic | `ClassSubjectRequirement` (classId, subjectId, teacherId?)         | sudah ada — inilah "jadwal" |
| Jadwal lengkap (opsional)    | academic | `LessonSchedule` + `LessonScheduleTeacher` + `LessonScheduleClass` | bisa dipakai bila perlu     |
| Shadow guru/kelas/siswa      | exam     | `ShadowTeacher`, `ShadowClass`, `ShadowClassStudent`               | sudah disinkron             |

---

## 3. Desain Data Baru

### 3.1 Entitas baru

**Frontend (`src/lib/types/index.ts`)**

```ts
export interface Subject {
	id: string;
	name: string;
	code?: string;
}
export interface TeacherSubject {
	teacherId: string;
	subjectId: string;
} // teacherId = userId user
export interface TeachingSchedule {
	teacherId: string;
	subjectId: string;
	classId: string;
}
```

**API — model Prisma baru (exam service)**

```prisma
model ShadowSubject {
  id   String @id
  code String
  name String
  exams Exam[]
  // createdAt, updatedAt, deletedAt, lastSyncAt (mengikuti pola shadow lain)
  @@map("shadow_subjects")
}

model ShadowTeacherSubject {          // sync dari academic SubjectTeacher
  id        String @id
  teacherId String @map("teacher_id") // master Teacher.id (di-map ke userId saat di-response)
  subjectId String @map("subject_id")
  status    String?
  // timestamp & @@map("shadow_teacher_subjects")
}

model ShadowTeachingSchedule {        // sync dari academic ClassSubjectRequirement
  id        String @id
  classId   String @map("class_id")
  subjectId String @map("subject_id")
  teacherId String @map("teacher_id")
  // timestamp & @@map("shadow_teaching_schedules")
}
```

### 3.2 Perubahan entitas lama

**API (Prisma exam service)**

```prisma
model Exam {
  ...
  subjectId String? @map("subject_id")
  subject   ShadowSubject? @relation(fields: [subjectId], references: [id])
  // questionCreatorId dipertahankan sementara (deprecate), dihapus di migrasi pembersihan
}

model ExamRoomClass {
  ...
  teacherId String? @map("teacher_id") // guru yang soalnya dipakai kelas ini (diisi admin)
}

model ExamQuestion {
  id             String   @id
  examId         String   @map("exam_id")
  teacherId      String?  @map("teacher_id") // NULL = soal legacy (dipakai semua pengampu)
  questionId     String   @map("question_id")
  questionNumber Int      @map("question_number")
  examRoomId     String?  @map("exam_room_id") // jembatan legacy; dihapus di migrasi berikutnya
  ...
}
```

**Frontend**

```ts
Exam           { ..., subjectId?: string }
ExamRoomClass  { ..., teacherId?: string | null }
ExamQuestion   { ..., examId: string; teacherId?: string | null }
```

### 3.3 Shadow data — sekarang di API, bukan hardcode frontend

Berbeda dari draf awal, karena **API ikut diubah**, shadow data tidak perlu di-hardcode di frontend. Data mengalir:

```
master.Subject ──┐
academic.SubjectTeacher ──┼─ sync ─> DB exam (shadow_*) ──> GET /exam/subjects,
academic.ClassSubjectRequirement ─┘                            /teacher-subjects, /teaching-schedules
```

Frontend membaca dari API. (Konstanta fallback di frontend tetap boleh dibuat untuk demo bila API belum jalan.)

---

## 4. Alur Baru per Fitur (Frontend)

### 4.1 Pembuatan & edit ujian (admin)

**File:** `src/routes/admin/exams/+page.server.ts`, `+page.svelte`, `+page.ts`

1. Form **Buat/Edit Ujian** + select **"Mata Pelajaran"** (wajib; data dari `GET /exam/subjects`).
2. Select **"Pembuat Soal"** dihapus. Setelah mapel dipilih, tampilkan info read-only:
   > _Guru pengampu {mapel}: Bu Sari, Pak Budi_ (dari `GET /exam/teacher-subjects?subjectId=`)
3. Kolom **Mapel** (badge) di daftar ujian.
4. Kirim `subjectId` ke `POST/PATCH /exam/exams`.

### 4.2 Assign kelas + pilih guru soal per kelas (admin)

**File:** `src/lib/components/admin/ExamDetail.svelte`, `src/routes/admin/exams/[examId]/rooms/+page.server.ts`, `+page.ts`

1. Opsi kelas difilter: hanya kelas di jadwal mapel ujian (`GET /exam/teaching-schedules?subjectId=` → filter `GET /exam/classes`).
2. Setiap kelas terpilih → dropdown **"Guru Soal"** (opsi = guru pengampu mapel; default = guru dari jadwal; admin bisa ganti).
3. Kirim `classAssignments: [{ classId, teacherId }]` ke `POST/PATCH /exam/exam-rooms`.
4. Chip per kelas di kartu ruangan & detail ruangan: _"Kelas 7A → soal oleh Bu Sari"_.
5. Kelas tanpa guru → tetap bisa disimpan, siswanya **tidak dapat soal**.
6. Ujian lama (tanpa `subjectId`) → semua kelas tampil tanpa dropdown guru (backward compatible).

### 4.3 Pembuatan soal oleh banyak guru

**File:** `src/routes/supervisor/questions/+page.ts`, `+page.svelte`, `[examId]/+page.ts`, `[examId]/+page.server.ts`

1. Daftar ujian guru: tampilkan ujian yang mapelnya diajar guru ini (`isTeacherOfSubject` via `teacher-subjects`).
2. Halaman soal per ujian: hanya soal **milik guru login** (`GET /exam/exam-questions?examId=&teacherId=`).
3. Tambah soal → `POST /exam/exam-questions` dengan `{ examId, teacherId, questionId, questionNumber }`.
4. Soal legacy (`teacherId` null) → tetap tampil untuk semua pengampu (migrasi aman).

### 4.4 Penentuan soal untuk siswa

**File:** `src/routes/participant/exams/[id]/+page.ts`

1. Cari `exam-room-class` untuk (ruang, kelas siswa) → ambil `teacherId`.
2. `GET /exam/exam-questions?examId=...&teacherId=...` → tampilkan soal itu saja.
3. Kelas off-grid / `teacherId` kosong → siswa **tidak melihat soal** (UI sudah punya pesan "Belum ada soal tersedia").

### 4.5 Koreksi esai & hasil

**File:** `src/routes/supervisor/grading/*`

- Guru mengoreksi esai **hanya soal yang dia buat** (kelas yang memakai soal dia). Filter via `GET /exam/essay-grades?...&teacherId=` (query baru, lihat §6.9).
- `super_admin` tetap bisa mengoreksi semua.
- Halaman hasil tidak berubah strukturnya.

---

## 5. Ringkasan Perubahan File (Frontend)

| Area           | File                                                                         | Perubahan                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Types          | `src/lib/types/index.ts`                                                     | `Subject`, `TeacherSubject`, `TeachingSchedule`, `Exam.subjectId`, `ExamRoomClass.teacherId`, `ExamQuestion.{examId,teacherId}` |
| Admin ujian    | `admin/exams/+page.{ts,server.ts,svelte}`                                    | Form mapel, info guru pengampu, kolom mapel                                                                                     |
| Admin ruangan  | `admin/exams/[examId]/rooms/+page.{ts,server.ts}`, `admin/ExamDetail.svelte` | Filter kelas, dropdown guru per kelas, chip                                                                                     |
| Detail ruangan | `admin/ExamRoomDetail.svelte`                                                | Tampilkan guru soal per kelas                                                                                                   |
| Guru (soal)    | `supervisor/questions/+page.ts`, `[examId]/+page.{ts,server.ts,svelte}`      | Filter mapel yang diajar, soal per guru                                                                                         |
| Peserta        | `participant/exams/[id]/+page.ts`                                            | Filter soal per guru kelas; off-grid → tanpa soal                                                                               |
| Grading        | `supervisor/grading/*`                                                       | Filter sesuai soal milik guru                                                                                                   |

---

## 6. Rencana Perubahan di Sisi API (`api-bn` / service `exam`)

> Semua path di bawah relatif ke `api-bn/`. Perintah migrasi: `npm run db:migrate:exam` (dari `api-bn/`).

### 6.1 Prisma schema — `src/exam/prisma/schema.prisma`

1. Tambah model `ShadowSubject`, `ShadowTeacherSubject`, `ShadowTeachingSchedule` (lihat §3.1).
2. `Exam`: + `subjectId String?` + relasi ke `ShadowSubject`.
3. `ExamRoomClass`: + `teacherId String?`.
4. `ExamQuestion`: + `examId String`, + `teacherId String?`; `examRoomId` jadi `String?` (jembatan legacy).
   - Hapus `@@unique([examRoomId, questionId])`.
   - Tambah partial unique index (preview `partialIndexes` sudah dipakai di master):
     ```prisma
     @@unique([examId, teacherId, questionId], where: raw("teacher_id IS NOT NULL"))
     @@unique([examId, teacherId, questionNumber], where: raw("teacher_id IS NOT NULL"))
     ```
   - Soal legacy (teacherId NULL) boleh punya nomor kembar antar ruang lama; unik hanya dijamin untuk data baru.

### 6.2 Migrasi database

Buat migrasi baru (direktori `src/exam/prisma/migrations/`). Inti SQL:

```sql
-- 1) Kolom baru
ALTER TABLE exam ADD COLUMN subject_id TEXT;
ALTER TABLE exam_room_class ADD COLUMN teacher_id TEXT;
ALTER TABLE exam_question ADD COLUMN exam_id TEXT;
ALTER TABLE exam_question ADD COLUMN teacher_id TEXT;

-- 2) Backfill exam_id dari relasi ruang
UPDATE exam_question eq
SET exam_id = er.exam_id
FROM exam_room er
WHERE eq.exam_room_id = er.id;

-- 3) Data lama: exam tanpa mapel → subject_id NULL (legacy), teacher_id NULL (soal "shared")

-- 4) Partial unique index untuk data baru (lihat §6.1)
```

- `questionCreatorId` & `examRoomId` dipertahankan dulu (deprecate), dihapus pada migrasi pembersihan setelah fitur stabil.

### 6.3 Modul baru: subject, teacher-subject, teaching-schedule

Ikuti pola modul existing (routes/controller/service/repository/schema). Bisa digabung dalam satu modul `subject` + `directory`.

- **`GET /subjects`** — list `ShadowSubject` (lazy sync dulu, seperti `class-directory`).
- **`GET /teacher-subjects?subjectId=`** — dari `ShadowTeacherSubject`; **map `teacherId` (master Teacher.id) → `userId`** lewat `ShadowTeacher` agar cocok dengan `/users` & `User.id` frontend. Sertakan `teacherEmail`, `fullname`.
- **`GET /teaching-schedules?subjectId=`** — dari `ShadowTeachingSchedule`; join `ShadowClass` (nama kelas) & map `teacherId` → `userId`. Response: `[{ classId, className, subjectId, teacherId }]`.

### 6.4 Modul exam — `modules/exam/`

- `exam.schema.ts`: tambah `subjectId: z.string().nullish()` di create & update; **hapus `questionCreatorId`** dari schema (frontend berhenti mengirim).
- `exam.types.ts`: `CreateExamDto`/`UpdateExamDto` mengikuti schema.
- `exam.query.ts` + `exam.controller.ts`: dukung `GET /exam/exams?subjectId=` (untuk daftar ujian per mapel).
- `exam.repository.ts` / `exam.service.ts`: simpan `subjectId`; logika lain tetap.

### 6.5 Modul exam-room — `modules/exam-room/`

- `exam-room.schema.ts`:
  ```ts
  createExamRoomSchema = z.strictObject({
  	examId: z.string().min(1),
  	roomId: z.string().min(1),
  	classAssignments: z
  		.array(
  			z.object({
  				classId: z.string().min(1),
  				teacherId: z.string().nullish() // null = kelas tanpa guru soal
  			})
  		)
  		.optional()
  });
  ```
- `exam-room.types.ts`: `CreateExamRoomDto`/`UpdateExamRoomDto` ikut berubah (`classIds` → `classAssignments`).
- `exam-room.repository.ts`:
  - `create`: `createMany` `examRoomClass` dengan `{ classId, teacherId }`.
  - `syncClassesAndCleanupParticipants`: diff berdasar `classId` seperti sekarang; **saat classId sama tapi teacherId berubah → `update` teacherId**; saat kelas dihapus → soft-delete + cleanup peserta (behavior existing dipertahankan).
- `exam-room.routes.ts`: tidak berubah (tetap POST/PATCH dengan schema baru). Response `GET /exam-rooms/:id` otomatis menyertakan `teacherId` (repo sudah include `examRoomClasses`).

### 6.6 Modul exam-question — `modules/exam-question/`

- `exam-question.schema.ts`:
  ```ts
  createExamQuestionSchema = z.strictObject({
  	examId: z.string().min(1),
  	teacherId: z.string().min(1), // wajib untuk soal baru
  	questionId: z.string().min(1),
  	questionNumber: z.number().int().positive()
  });
  ```
- `exam-question.service.ts`:
  - Unik per **(examId, teacherId)**: ganti `assertUniqueRoomQuestion/Number` → `assertUniqueTeacherQuestion/Number`.
  - Redis cache: kunci `exam_questions:${examId}:${teacherId}` (ganti `exam_questions:${examRoomId}`); invalidate pada create/update/delete.
  - `getAll` mendukung `?examId=` dan `?teacherId=`; **pertahankan `?examRoomId=` untuk kompatibilitas legacy** (join `examId` via room bila perlu).
- `exam-question.repository.ts`: query ikut berubah (where examId/teacherId; include examRoomId untuk legacy).

### 6.7 Penentuan set soal peserta (submit / grade / force-submit)

Semua tempat yang sekarang query `examQuestion.findMany({ where: { examRoomId } })` harus menentukan set soal **per peserta**:

```
userId ──> ShadowStudent.classId ──> ExamRoomClass(examRoomId, classId).teacherId
        ──> ExamQuestion where examId = examRoom.examId AND (teacherId = X OR teacherId IS NULL)
```

File terdampak:

- `modules/exam-room/exam-room.submit.ts` — `submitParticipant` & `forceSubmitAbsentParticipants` (scoring MC dan pengecekan "semua MC" memakai set soal peserta, bukan semua soal ruang).
- `modules/exam-room/exam-room.routes.ts` — endpoint `POST /:id/grade/:userId` (ambil examQuestions per set peserta; agregasi esai per set).
- Helper bersama: buat fungsi `getParticipantQuestionSet(examRoomId, userId)` (mis. di `exam-room.service.ts` atau util) agar logika submit/grade/force-submit konsisten.

Catatan: `ExamAnswer`/`EssayGrade` tetap per `(examRoomId, userId, questionId)` — tidak berubah.

### 6.8 Shadow sync service — `src/exam/src/services/shadow-sync.service.ts`

Tambahkan metode (pola sama dengan `syncTeachers()` dkk., baca langsung via `orchestrator`):

- `syncSubjects()` — dari `orchestrator.masterSubject` (atau `academicShadowSubject`).
- `syncTeacherSubjects()` — dari `orchestrator.academicSubjectTeacher`.
- `syncTeachingSchedules()` — dari `orchestrator.academicClassSubjectRequirement`.
- Masukkan ke `lazySyncAll()`.

### 6.9 Ringkasan endpoint final (perubahan)

| Method & Path                             | Perubahan                                                    |
| ----------------------------------------- | ------------------------------------------------------------ |
| `GET /exam/subjects`                      | **Baru**                                                     |
| `GET /exam/teacher-subjects?subjectId=`   | **Baru**                                                     |
| `GET /exam/teaching-schedules?subjectId=` | **Baru**                                                     |
| `POST/PATCH /exam/exams`                  | body + `subjectId`; `questionCreatorId` dihapus              |
| `GET /exam/exams`                         | + filter `subjectId`                                         |
| `POST/PATCH /exam/exam-rooms`             | body `classIds` → `classAssignments[{classId, teacherId?}]`  |
| `GET /exam/exam-rooms/:id`                | `examRoomClasses[].teacherId` ikut ter-serialize             |
| `POST /exam/exam-questions`               | body `{examId, teacherId, questionId, questionNumber}`       |
| `GET /exam/exam-questions`                | + filter `examId` & `teacherId`; `examRoomId` tetap (legacy) |
| `GET /exam/essay-grades`                  | (opsional) + filter `teacherId` untuk koreksi per guru       |

### 6.10 Ringkasan file API yang diubah/ditambah

| Area          | File (relatif `api-bn/src/exam`)                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema DB     | `prisma/schema.prisma` + migrasi baru                                                                                                        |
| Sync          | `src/services/shadow-sync.service.ts`                                                                                                        |
| Modul baru    | `src/modules/subject/*` (atau gabung ke `directory`), `src/modules/teacher-subject/*`, `src/modules/teaching-schedule/*`                     |
| Exam          | `src/modules/exam/{exam.schema,exam.types,exam.query,exam.controller,exam.service,exam.repository}.ts`                                       |
| Exam-room     | `src/modules/exam-room/{exam-room.schema,exam-room.types,exam-room.repository,exam-room.service}.ts`                                         |
| Exam-question | `src/modules/exam-question/{exam-question.schema,exam-question.types,exam-question.service,exam-question.repository,exam-question.query}.ts` |
| Submit/grade  | `src/modules/exam-room/exam-room.submit.ts`, `exam-room.routes.ts`                                                                           |
| Route mount   | `src/routes/index.ts` (+ 3 router baru)                                                                                                      |

### 6.11 Backward compatibility

- Ujian lama tanpa `subjectId` → berfungsi seperti sekarang (semua kelas, tanpa dropdown guru).
- Soal lama (`teacherId` NULL) → dianggap "shared": tampil untuk semua guru pengampu & semua siswa di ruang itu sampai ada soal baru.
- `questionCreatorId` & `examRoomId` dipertahankan (deprecate) → dihapus setelah masa transisi.
- Frontend lama yang masih mengirim `classIds` → beri fallback: `classAssignments` di-derive dari `classIds` dengan `teacherId: null` bila perlu (agar tidak pecah saat deploy bergantian).

---

## 7. Milestone Implementasi

**Tahap API (`api-bn`)**

- **[M0]** Prisma schema + migrasi (§6.1–6.2) → `npm run db:migrate:exam`.
- **[M1]** Shadow sync + endpoint `/subjects`, `/teacher-subjects`, `/teaching-schedules` (§6.3, §6.8).
- **[M2]** Modul exam: `subjectId` (§6.4).
- **[M3]** Modul exam-room: `classAssignments` + `teacherId` (§6.5).
- **[M4]** Modul exam-question: `examId`+`teacherId` + cache + set soal peserta di submit/grade (§6.6–6.7).

**Tahap Frontend (`exam-bn`)**

- **[F1]** Types + (opsional) fallback data.
- **[F2]** Admin: form ujian + mapel + info guru pengampu.
- **[F3]** Admin: assign kelas + pilih guru per kelas + chip.
- **[F4]** Guru: daftar ujian per mapel + halaman soal per guru.
- **[F5]** Peserta: filter soal per guru kelas; off-grid → tanpa soal.
- **[F6]** Grading & hasil.

**QA**

- API: build/typecheck service exam + uji endpoint dengan curl.
- Frontend: `npm run check`, `npm run lint`.
- Uji end-to-end skenario §8.

---

## 8. Contoh Skenario Uji

Data: Bu Sari & Pak Budi mengajar B. Indonesia (dari `SubjectTeacher`); jadwal: Sari→7A/7B, Budi→8A (dari `ClassSubjectRequirement`).

1. Admin buat **"UTS Bahasa Indonesia"** → pilih mapel B. Indonesia → tampil _Guru pengampu: Bu Sari, Pak Budi_.
2. Admin alokasikan ruangan → pilihan kelas hanya 7A, 7B, 8A; default guru: 7A→Sari, 7B→Sari, 8A→Budi; uji ubah 7B→Budi.
3. Bu Sari & Pak Budi masing-masing buat 5 soal (masing-masing hanya melihat soalnya sendiri).
4. Siswa 7A → soal Sari; 7B → soal **Budi** (override); 8A → soal Budi.
5. Kelas 9A (tidak di jadwal) tidak muncul di pilihan kelas; jika dipaksa → siswanya tanpa soal.
6. Submit otomatis: skor dihitung dari set soal peserta masing-masing.
7. Koreksi esai: Sari hanya melihat 7A; Budi melihat 7B & 8A.
8. **Migrasi**: ujian lama & soal lama tetap jalan (tanpa mapel / soal shared).

---

## 9. Asumsi & Pertanyaan Terbuka

**Asumsi:**

1. Pembuat soal ujian = semua guru pengampu mapel (dari `SubjectTeacher`); admin hanya memilih **guru soal per kelas**.
2. Jadwal default per kelas dari `ClassSubjectRequirement`; admin bisa override.
3. Kelas off-grid / tanpa guru soal → siswa tidak dapat soal.
4. Ujian lama tanpa `subjectId` → perilaku lama.
5. Soal legacy (`teacherId` NULL) → shared untuk semua pengampu.

**Pertanyaan tersisa:**

1. Admin perlu **CRUD master data** (mapel, guru–mapel, jadwal) lewat UI? (Rekomendasi: tidak dulu; data dikelola di master/academic service yang sudah ada.)
2. Sumber jadwal default: pakai `ClassSubjectRequirement` (sederhana) atau `LessonSchedule` (lebih akurat per hari/jam)? _(Rekomendasi: `ClassSubjectRequirement`.)_
3. Guru yang sama dipakai untuk 2 ruang/kelas → soal dipakai bersama, konfirmasi.
4. Koreksi esai bila guru pembuat tidak aktif → `super_admin` bisa koreksi semua.
