-- AlterTable: guru soal per peserta (alokasi manual per individu)
ALTER TABLE "exam_participant" ADD COLUMN "teacher_id" TEXT;

-- CreateIndex
CREATE INDEX "exam_participant_teacher_id_idx" ON "exam_participant"("teacher_id");
