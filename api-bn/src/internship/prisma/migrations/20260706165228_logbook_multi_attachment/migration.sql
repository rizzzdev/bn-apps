/*
  Warnings:

  - You are about to drop the column `photo_path` on the `daily_logbooks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "daily_logbooks" DROP COLUMN "photo_path";

-- CreateTable
CREATE TABLE "logbook_attachments" (
    "id" TEXT NOT NULL,
    "logbook_id" TEXT NOT NULL,
    "attachment_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logbook_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logbook_attachments_logbook_id_idx" ON "logbook_attachments"("logbook_id");

-- CreateIndex
CREATE INDEX "logbook_attachments_attachment_id_idx" ON "logbook_attachments"("attachment_id");

-- AddForeignKey
ALTER TABLE "logbook_attachments" ADD CONSTRAINT "logbook_attachments_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "daily_logbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_attachments" ADD CONSTRAINT "logbook_attachments_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
