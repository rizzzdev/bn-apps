/*
  Warnings:

  - You are about to drop the `logbook_attachments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "logbook_attachments" DROP CONSTRAINT "logbook_attachments_attachment_id_fkey";

-- DropForeignKey
ALTER TABLE "logbook_attachments" DROP CONSTRAINT "logbook_attachments_logbook_id_fkey";

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "logbook_id" TEXT;

-- DropTable
DROP TABLE "logbook_attachments";

-- CreateIndex
CREATE INDEX "attachments_logbook_id_idx" ON "attachments"("logbook_id");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "daily_logbooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
