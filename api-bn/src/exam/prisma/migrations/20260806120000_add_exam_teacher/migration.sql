-- CreateTable: guru pembuat soal per ujian (tidak otomatis semua pengampu)
CREATE TABLE "exam_teacher" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_teacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_teacher_exam_id_teacher_id_key" ON "exam_teacher"("exam_id", "teacher_id");

CREATE INDEX "exam_teacher_exam_id_idx" ON "exam_teacher"("exam_id");

CREATE INDEX "exam_teacher_teacher_id_idx" ON "exam_teacher"("teacher_id");

CREATE INDEX "exam_teacher_deleted_at_idx" ON "exam_teacher"("deleted_at");

-- AddForeignKey
ALTER TABLE "exam_teacher" ADD CONSTRAINT "exam_teacher_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
