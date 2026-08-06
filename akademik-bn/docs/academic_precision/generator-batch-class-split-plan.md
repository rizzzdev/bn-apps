# Rencana Implementasi Generator Jadwal: Batch Teaching Eksplisit & Mapel Paralel (Split Kelas)

> Status: **Kasus 1 SELESAI DIIMPLEMENTASIKAN (backend api-bn + frontend akademik-bn).**
> Kasus 2: desain tersimpan di Seksi 3, implementasi ditunda atas permintaan user.
> Catatan koreksi: validasi beban guru (A4/B4) TIDAK perlu diubah — lihat penjelasan di bawah.
> Cakupan repo: perubahan backend di repo sibling `api-bn` (path ditulis relatif ke `api-bn/`), frontend di repo ini (`akademik-bn`).

---

## 1. Konteks & Dua Kasus

**Kasus 1 — Batch teaching sebagian (Opsi A).**
Satu mapel diampu satu guru, 4 JP/minggu. 1 JP diajarkan bersama ke 7 kelas sekaligus (batch), 3 JP sisanya individual per kelas.
→ Saat ini engine **auto-gabung** konfigurasi (mapel, guru, JP, max JP/hari) identik antar kelas → 7 kelas pasti digabung **semua 4 JP** menjadi batch. Tidak ada mode campuran.

**Kasus 2 — Mapel paralel dalam 1 slot (split kelas).**
Dalam satu JP yang sama di satu kelas ada beberapa mapel (mis. agama: Islam/Kristen/Katolik/...) yang masing-masing punya guru sendiri; siswa kelas terpecah mengikuti agamanya.
→ Saat ini `classOccupied` berbasis `classId` → dua unit kelas yang sama di jam yang sama dianggap bentrok, padahal siswa & guru berbeda (okupansi seharusnya **per kelompok siswa**, bukan per kelas).

Kedua fitur **ortogonal** dan bisa digabung.

---

## 2. Rencana Kasus 1 — Opsi A: field `batchWeeklyHours` + `batchGroupId`

Strategi: tetap 1 baris `ClassSubjectRequirement` per (kelas × mapel × guru), tambah 2 field:

- `batchWeeklyHours Int @default(0)` — porsi JP yang diajarkan bersama (kasus: 1)
- `batchGroupId String?` — penanda grup batch eksplisit (7 kelas berbagi nilai sama)

### 2.1 Backend (`api-bn`)

#### A1. `src/academic/prisma/schema.prisma` — model `ClassSubjectRequirement`

```prisma
model ClassSubjectRequirement {
  id               String    @id @default(uuid())
  classId          String    @map("class_id")
  subjectId        String    @map("subject_id")
  teacherId        String?   @map("teacher_id")
  weeklyHours      Int       @default(2) @map("weekly_hours")
  batchWeeklyHours Int       @default(0) @map("batch_weekly_hours") // BARU
  batchGroupId     String?   @map("batch_group_id")                 // BARU
  maxHoursPerDay   Int       @default(2) @map("max_hours_per_day")
  // createdAt/updatedAt/deletedAt tetap
}
```

Migrasi (dev: `npm run db:migrate:academic`, prod: `npm run db:migrate:deploy:academic`) + `npm run db:generate:academic`.
Best practice:

- Kolom **additive + default** → backward compatible; data lama otomatis `0`/`NULL` (perilaku individual seperti sekarang).
- Urutan deploy: **migrate → API → frontend**.
- Verifikasi SQL migrasi = `ADD COLUMN` + default (tidak boleh drop/rename).

#### A2. `src/academic/src/modules/class-subject-requirements/domain/schemas.ts`

```ts
export const createClassSubjectRequirementSchema = z
	.object({
		classId: z.string().uuid(),
		subjectId: z.string().uuid(),
		teacherId: z.string().uuid().optional().nullable(),
		weeklyHours: z.number().int(),
		maxHoursPerDay: z.number().int().default(2),
		batchWeeklyHours: z.number().int().min(0).default(0), // BARU
		batchGroupId: z.string().uuid().optional().nullable() // BARU
	})
	.refine((d) => d.batchWeeklyHours <= d.weeklyHours, {
		message: 'JP batch tidak boleh melebihi total JP mingguan',
		path: ['batchWeeklyHours']
	});
```

Best practice: jika `batchWeeklyHours > 0`, **wajibkan `batchGroupId`** (grup eksplisit, tidak ambigu). `dtos.ts` tidak perlu diubah.

#### A3. `.../class-subject-requirements/repository/class-subject-requirements.repository.ts`

`upsert()` (cabang create & update) dan `update()`: sertakan `batchWeeklyHours` & `batchGroupId` di object `data`; tambahkan `batchGroupId` ke daftar `putOptionalToNull`.

#### A4. `.../class-subject-requirements/service/class-subject-requirements.service.ts` — 1 perubahan validasi

1. **Baru `validateBatchConsistency(data)`** — dipanggil di `upsert()` & `bulkUpsert()` (dalam transaksi):
   - Semua baris satu `batchGroupId` harus punya `subjectId`, `teacherId`, `weeklyHours`, `batchWeeklyHours`, `maxHoursPerDay` identik.
   - `classId` dalam satu grup unik.
   - Batch 1 kelas → engine memperlakukan sebagai individual (guard `classIds.length > 1` di split engine).

**Koreksi (penting)**: `validateTeacherOverload()` TIDAK perlu diubah. Karena model satu-baris mempertahankan `weeklyHours=4` (batchWeeklyHours hanya anotasi porsi, bukan baris terpisah), heuristik "max weeklyHours per single class" yang sudah ada tetap benar: `max(4,4,...)=4`, dan porsi batch otomatis dihitung sekali tanpa dikalikan jumlah kelas.

#### A5. `.../timetable-generator/service/generator.service.ts`

Saat map ke `engineInput.requirements`, tambah `batchWeeklyHours: r.batchWeeklyHours ?? 0` dan `batchGroupId: r.batchGroupId ?? null`.
**Tidak perlu disentuh:** `timetable-queue.ts`, `timetable.worker.ts`, `engine-runner.ts`, controller, route (engineInput lolos sebagai JSON).

#### A6. `.../timetable-generator/service/backtracking-engine.ts` (inti)

1. `EngineRequirementInput` + 2 field opsional.
2. **Team merge** — bawa nilai batch: `batchWeeklyHours = max(...rows)`, `batchGroupId` dari baris dengan batch > 0.
3. **Batch merge — ganti auto-infer dengan grup eksplisit:**
   ```ts
   if (enableBatch) {
   	const batchMap = new Map<string, MergedGroup>();
   	const nonBatch: MergedGroup[] = [];
   	for (const g of mergedGroups) {
   		const bHours = g.batchWeeklyHours ?? 0;
   		if (bHours <= 0 || !g.batchGroupId) {
   			nonBatch.push(g);
   			continue;
   		}
   		const key = `${g.subjectId}|${[...g.teacherIds].sort().join(',')}|${bHours}|${g.batchGroupId}`;
   		batchMap.has(key)
   			? batchMap.get(key)!.classIds.push(...g.classIds)
   			: batchMap.set(key, { ...g });
   	}
   	mergedGroups = [...nonBatch, ...batchMap.values()];
   }
   ```
   Bonus: mapel berkonfigurasi identik **tidak lagi tergabung tanpa sengaja**.
4. **Split unit** — batch group → 1 unit batch (semua kelas, durasi = `batchWeeklyHours`) + unit individual per kelas (durasi `weeklyHours − batchWeeklyHours`, dibelah per `maxHoursPerDay`). Defensive: `Math.min(batchWeeklyHours, weeklyHours)`.

Konstrain yang ada (`classOccupied`, `teacherOccupied`, `isValidSlot`, MRV, best-partial) **tidak diubah**; unit batch otomatis memeriksa semua `classIds`. MRV cenderung memprioritaskan unit batch (7 kelas) karena slotnya paling terbatas — justru diinginkan.

### 2.2 Frontend (`akademik-bn`)

#### B1. `src/lib/types.ts` — `ClassSubjectRequirement`

```ts
weeklyHours: number;
batchWeeklyHours?: number;    // BARU
batchGroupId?: string | null; // BARU
maxHoursPerDay: number;
```

#### B2. `src/routes/(app)/lesson-schedule/generator/+page.svelte`

- State baru: `createBatchWeeklyHours` (default 0), `createBatchGroupId` (`crypto.randomUUID()` saat modal dibuka — **satu id untuk semua kelas dalam satu mapping**).
- Input "JP yang diajarkan bersama (batch)" di samping "Jam / Minggu" + hint.
- Validasi submit: `batchWeeklyHours <= weeklyHours`; jika `> 0` → minimal 2 kelas; `maxHoursPerDay >= 1`.
- `handleCreateMapping()`: sertakan `batchWeeklyHours` & `batchGroupId` di payload (tetap 1 baris per kelas).
- Tabel Tab 1: tampilkan `4 JP · 1 JP batch`.

#### B3. `loadRequirementsForClass()` — baca `batchWeeklyHours` dari rows saat grouping per subject.

#### B4. `checkOverAllocatedTeachers()` — TIDAK PERLU DIUBAH (koreksi desain awal). Heuristik "max weeklyHours per single class" tetap benar pada model satu-baris; porsi batch tidak mengubah weeklyHours sehingga dihitung sekali secara alami.

#### B5. Tidak berubah

`timetable-grid-table.svelte` (sudah render multi-kelas), `timetable-generator.service.ts` (GenerateOptions tetap), utils schedule-event. Verifikasi satu kali halaman print.

### 2.3 Checklist Kasus 1

| #   | Langkah                                                                               | Repo        | Status                    |
| --- | ------------------------------------------------------------------------------------- | ----------- | ------------------------- |
| 1   | Prisma schema + migrasi `20260805091240_add_batch_teaching` + generate                | api-bn      | ✅                        |
| 2   | Zod schema + repository                                                               | api-bn      | ✅                        |
| 3   | Service: `validateBatchConsistency` (rumus overload tidak berubah)                    | api-bn      | ✅                        |
| 4   | `generator.service.ts`: map ke engineInput                                            | api-bn      | ✅                        |
| 5   | Engine: merge eksplisit + split batch/individual                                      | api-bn      | ✅                        |
| 6   | Unit/smoke test engine skenario 7 kelas (1 batch + 3 individual)                      | api-bn      | ✅ (smoke test PASSED)    |
| 7   | `types.ts` + modal & tabel & load halaman generator                                   | akademik-bn | ✅                        |
| 8   | `checkOverAllocatedTeachers` — tidak diubah (koreksi)                                 | akademik-bn | ✅ (svelte-check 0 error) |
| 9   | Validasi: `tsc --noEmit` (api, error exam pre-existing), `svelte-check` + eslint (fe) | keduanya    | ✅                        |
| 10  | Update docs + smoke test end-to-end                                                   | keduanya    | ✅                        |

---

## 3. Desain Kasus 2 — Mapel paralel dalam 1 slot (split kelas / agama)

### 3.1 Akar masalah

`classOccupied` (key `classId`) melarang dua unit kelas yang sama di jam yang sama. Untuk agama: guru beda + siswa terpecah per kelompok → okupansi harus **per (kelas, kelompok siswa)**, bukan per kelas. Konstrain guru tetap per guru (sudah benar).

### 3.2 Desain

#### C1. Entitas `ClassGroup` (baru)

```prisma
model ClassGroup {
  id        String  @id @default(uuid())
  classId   String  @map("class_id")
  name      String  // "Islam", "Kristen", ...
  studentCount Int? @map("student_count") // opsional
  @@map("class_groups")
}
```

Best practice: validasi jumlah siswa seluruh kelompok = jumlah siswa kelas.

#### C2. `ClassSubjectRequirement` — 2 field tambahan (digabung dengan Kasus 1)

```prisma
  groupId      String? @map("group_id")      // BARU: mapel untuk kelompok ini saja; NULL = seluruh kelas
  syncGroupId  String? @map("sync_group_id") // BARU: baris se-kelas yang wajib serentak (paralel)
```

#### C3. Engine — okupansi berbasis scope

- `EngineInput` tambah `classGroups?: Record<classId, string[]>`.
- Kunci okupansi: `(classId, groupId)`.
  - Unit seluruh kelas (`groupId` null) menempati **semua** groupId kelas itu; kelas tanpa grup → pseudo `__all__` (= perilaku hari ini).
  - Unit kelompok menempati groupId-nya sendiri.
  - Bentrok otomatis benar: 2 kelompok berbeda = boleh bareng; unit seluruh kelas vs kelompok mana pun = bentrok; kelompok sama = bentrok.
- Backward compatible penuh.

#### C4. Engine — sinkronisasi paralel (`syncGroupId`)

- Unit dengan `syncGroupId` sama (+ kelas sama, durasi sama) digabung menjadi satu item assignable **`ParallelGroup`**:
  - `getValidSlots` = irisan slot valid semua member (guru + kelompok masing-masing bebas di slot itu).
  - Satu slot dipilih → semua member di-assign; okupansi diterapkan per member.
- MRV/backtracking tidak berubah (ParallelGroup = 1 item).
- Validasi: member satu syncGroup wajib `weeklyHours` & `maxHoursPerDay` sama (durasi sama). Kalau ada agama dengan JP berbeda (mis. Islam 2, Kristen 1), sync hanya valid bila JP sama — dokumentasikan.

#### C5. Commit

Tidak berubah — setiap agama = 1 `LessonSchedule` + 1 `LessonScheduleClass` + 1 `LessonScheduleTeacher`.

#### C6. Frontend

- CRUD ringan kelompok siswa per kelas (dalam generator).
- Modal mapping: pilih "Kelompok Siswa" (opsional) + flag "Sejajarkan slot dengan mapel lain" (syncGroupId).
- Preview grid: `TimetableGridTable` **sudah** menampilkan banyak slot bertumpuk dalam satu sel (`{#each daySlots}`) → mapel paralel tampil sebagai kartu terpisah per guru. Peningkatan opsional: badge "paralel" pada kartu.
- Validasi jumlah kelompok = jumlah siswa kelas.

### 3.3 Alternatif tanpa perubahan kode (catatan penting)

Jika mapel paralel **TIDAK wajib serentak** (boleh di jam berbeda), sistem **sekarang sudah bisa**: setiap agama = mapel biasa + guru sendiri, engine menempatkan di jam berbeda secara otomatis. Desain C1–C6 hanya diperlukan untuk memaksa **serentak dalam slot yang sama**.

---

## 4. Komposisi Kedua Fitur

- **Batch (Kasus 1)**: 1 guru × 1 mapel × banyak kelas × 1 slot.
- **Paralel (Kasus 2)**: 1 kelas × banyak mapel+guru × 1 slot.
- Unit batch menempati semua kelompok dari semua kelasnya; scope okupansi (C3) komposisional dengan classIds unit batch.
- Kombinasi yang mungkin (mis. "PAI diajarkan batch ke 7 kelas, dan di jam yang sama kelas itu juga ada agama Kristen paralel") otomatis terpenuhi selama scope okupansi konsisten.

## 5. Best Practices Umum

1. **Backward compatibility**: semua field baru default `0`/`null`; validasi berlapis (zod → service → defensive clamp engine → UI).
2. **Satu grup = satu entitas**: `batchGroupId`/`syncGroupId` dibangkitkan sekali per operasi mapping (bukan per baris).
3. **Semantik toggle `enableBatchTeaching`**: ketika off, perlakukan `batchWeeklyHours` sebagai 0 (master kill-switch).
4. **Determinism engine**: selalu sort array sebelum iterasi.
5. **Testing**: tidak ada infra test di `api-bn` → rekomendasi vitest + unit test engine (pure class, tanpa DB) untuk skenario 7 kelas (1 batch + 3 individual): asersi 1 slot batch berisi 7 kelas, 21 slot individual, total 4 JP/kelas, tanpa bentrok.
6. **Validasi**: api `npm run build`; fe `npm run check` (svelte-check), `npm run format`, `npm run lint`.
7. **Dokumentasi**: perbarui `docs/academic_precision/DESIGN.md` & doc generator.
