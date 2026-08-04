/*
  Warnings:

  - You are about to drop the column `exam_room_id` on the `exam_chat` table. All the data in the column will be lost.
  - You are about to drop the column `sender_name` on the `exam_chat` table. All the data in the column will be lost.
  - You are about to drop the column `sender_role` on the `exam_chat` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `exam_chat` table. All the data in the column will be lost.
  - Added the required column `receiver_id` to the `exam_chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `exam_chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "exam_chat" DROP CONSTRAINT "exam_chat_exam_room_id_fkey";

-- DropForeignKey
ALTER TABLE "exam_chat" DROP CONSTRAINT "exam_chat_user_id_fkey";

-- DropIndex
DROP INDEX "exam_chat_exam_room_id_idx";

-- AlterTable
ALTER TABLE "exam_chat" DROP COLUMN "exam_room_id",
DROP COLUMN "sender_name",
DROP COLUMN "sender_role",
DROP COLUMN "user_id",
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiver_id" VARCHAR(25) NOT NULL,
ADD COLUMN     "sender_id" VARCHAR(25) NOT NULL;

-- CreateIndex
CREATE INDEX "exam_chat_sender_id_receiver_id_idx" ON "exam_chat"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "exam_chat_receiver_id_sender_id_idx" ON "exam_chat"("receiver_id", "sender_id");

-- AddForeignKey
ALTER TABLE "exam_chat" ADD CONSTRAINT "exam_chat_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_chat" ADD CONSTRAINT "exam_chat_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
