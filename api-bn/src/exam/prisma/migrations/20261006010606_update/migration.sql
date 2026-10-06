/*
  Warnings:

  - You are about to drop the column `subject_id` on the `exam` table. All the data in the column will be lost.
  - You are about to drop the column `class_id` on the `exam_participant` table. All the data in the column will be lost.
  - You are about to drop the column `teacher_id` on the `exam_participant` table. All the data in the column will be lost.
  - You are about to drop the column `exam_id` on the `exam_question` table. All the data in the column will be lost.
  - You are about to drop the column `teacher_id` on the `exam_question` table. All the data in the column will be lost.
  - You are about to drop the column `teacher_id` on the `exam_room_class` table. All the data in the column will be lost.
  - You are about to drop the `exam_teacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shadow_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shadow_teacher_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shadow_teaching_schedules` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[exam_room_id,question_id]` on the table `exam_question` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `exam_room_id` to the `exam_question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "exam_teacher" DROP CONSTRAINT "exam_teacher_exam_id_fkey";

-- DropIndex
DROP INDEX "exam_subject_id_idx";

-- DropIndex
DROP INDEX "exam_participant_class_id_idx";

-- DropIndex
DROP INDEX "exam_participant_exam_room_id_class_id_idx";

-- DropIndex
DROP INDEX "exam_participant_teacher_id_idx";

-- DropIndex
DROP INDEX "exam_question_exam_id_idx";

-- DropIndex
DROP INDEX "exam_question_teacher_id_idx";

-- DropIndex
DROP INDEX "exam_room_class_teacher_id_idx";

-- AlterTable
ALTER TABLE "exam" DROP COLUMN "subject_id",
ADD COLUMN     "question_creator_id" TEXT;

-- AlterTable
ALTER TABLE "exam_participant" DROP COLUMN "class_id",
DROP COLUMN "teacher_id";

-- AlterTable
ALTER TABLE "exam_question" DROP COLUMN "exam_id",
DROP COLUMN "teacher_id",
ADD COLUMN     "exam_room_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "exam_room_class" DROP COLUMN "teacher_id";

-- DropTable
DROP TABLE "exam_teacher";

-- DropTable
DROP TABLE "shadow_subjects";

-- DropTable
DROP TABLE "shadow_teacher_subjects";

-- DropTable
DROP TABLE "shadow_teaching_schedules";

-- CreateIndex
CREATE UNIQUE INDEX "exam_question_exam_room_id_question_id_key" ON "exam_question"("exam_room_id", "question_id");

-- AddForeignKey
ALTER TABLE "exam_question" ADD CONSTRAINT "exam_question_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
