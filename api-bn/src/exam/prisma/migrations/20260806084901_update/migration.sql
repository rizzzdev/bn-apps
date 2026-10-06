/*
  Warnings:

  - You are about to drop the column `question_creator_id` on the `exam` table. All the data in the column will be lost.
  - You are about to drop the column `exam_room_id` on the `exam_question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "exam" DROP COLUMN "question_creator_id";

-- AlterTable
ALTER TABLE "exam_question" DROP COLUMN "exam_room_id";
