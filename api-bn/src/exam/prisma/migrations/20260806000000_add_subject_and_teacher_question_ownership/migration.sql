-- AlterTable: exam — tambah mapel ujian
ALTER TABLE "exam" ADD COLUMN "subject_id" TEXT;

-- AlterTable: exam_room_class — tambah guru soal per kelas
ALTER TABLE "exam_room_class" ADD COLUMN "teacher_id" TEXT;

-- AlterTable: exam_question — tambah exam_id & teacher_id (soal per ujian+guru)
ALTER TABLE "exam_question" ADD COLUMN "exam_id" TEXT;
ALTER TABLE "exam_question" ADD COLUMN "teacher_id" TEXT;

-- Backfill exam_id dari relasi exam_room (data lama: soal per ruang → per ujian).
-- Data lama tanpa pemilik (teacher_id NULL) tetap dipertahankan sebagai soal "shared".
UPDATE "exam_question" eq
SET "exam_id" = er."exam_id"
FROM "exam_room" er
WHERE eq."exam_room_id" = er."id" AND eq."exam_id" IS NULL;

-- Bersihkan baris yatim (tanpa exam_room valid) lalu jadikan exam_id wajib
DELETE FROM "exam_question" WHERE "exam_id" IS NULL;
ALTER TABLE "exam_question" ALTER COLUMN "exam_id" SET NOT NULL;

-- Lepas relasi lama (kolom exam_room_id & datanya dipertahankan agar tidak break data lama)
ALTER TABLE "exam_question" DROP CONSTRAINT "exam_question_exam_room_id_fkey";
DROP INDEX "exam_question_exam_room_id_question_id_key";

-- CreateTable: shadow_subjects (sync dari master Subject)
CREATE TABLE "shadow_subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable: shadow_teacher_subjects (sync dari academic SubjectTeacher)
CREATE TABLE "shadow_teacher_subjects" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable: shadow_teaching_schedules (sync dari academic ClassSubjectRequirement)
CREATE TABLE "shadow_teaching_schedules" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_teaching_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: shadow baru
CREATE INDEX "shadow_subjects_deleted_at_idx" ON "shadow_subjects"("deleted_at");

CREATE INDEX "shadow_teacher_subjects_teacher_id_idx" ON "shadow_teacher_subjects"("teacher_id");

CREATE INDEX "shadow_teacher_subjects_subject_id_idx" ON "shadow_teacher_subjects"("subject_id");

CREATE INDEX "shadow_teacher_subjects_deleted_at_idx" ON "shadow_teacher_subjects"("deleted_at");

CREATE INDEX "shadow_teaching_schedules_class_id_idx" ON "shadow_teaching_schedules"("class_id");

CREATE INDEX "shadow_teaching_schedules_subject_id_idx" ON "shadow_teaching_schedules"("subject_id");

CREATE INDEX "shadow_teaching_schedules_teacher_id_idx" ON "shadow_teaching_schedules"("teacher_id");

CREATE INDEX "shadow_teaching_schedules_deleted_at_idx" ON "shadow_teaching_schedules"("deleted_at");

-- CreateIndex: partial unique untuk data baru (legacy teacher_id NULL bebas duplikat)
CREATE UNIQUE INDEX "exam_question_exam_id_teacher_id_question_id_key"
ON "exam_question"("exam_id", "teacher_id", "question_id")
WHERE "teacher_id" IS NOT NULL;

CREATE UNIQUE INDEX "exam_question_exam_id_teacher_id_question_number_key"
ON "exam_question"("exam_id", "teacher_id", "question_number")
WHERE "teacher_id" IS NOT NULL;

-- CreateIndex: indeks pendukung
CREATE INDEX "exam_question_exam_id_idx" ON "exam_question"("exam_id");

CREATE INDEX "exam_question_teacher_id_idx" ON "exam_question"("teacher_id");

CREATE INDEX "exam_subject_id_idx" ON "exam"("subject_id");

CREATE INDEX "exam_room_class_teacher_id_idx" ON "exam_room_class"("teacher_id");
