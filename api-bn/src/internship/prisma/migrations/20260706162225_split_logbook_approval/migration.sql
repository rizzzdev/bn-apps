/*
  Warnings:

  - You are about to drop the column `approved_at` on the `daily_logbooks` table. All the data in the column will be lost.
  - You are about to drop the column `approved_by` on the `daily_logbooks` table. All the data in the column will be lost.
  - You are about to drop the column `status_approval` on the `daily_logbooks` table. All the data in the column will be lost.
  - Added the required column `duration_days` to the `internship_placements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "placement_status" ADD VALUE 'discontinued';

-- DropForeignKey
ALTER TABLE "daily_logbooks" DROP CONSTRAINT "daily_logbooks_approved_by_fkey";

-- DropIndex
DROP INDEX "daily_logbooks_status_approval_idx";

-- AlterTable
ALTER TABLE "daily_logbooks" DROP COLUMN "approved_at",
DROP COLUMN "approved_by",
DROP COLUMN "status_approval",
ADD COLUMN     "mentor_approved_at" TIMESTAMPTZ,
ADD COLUMN     "mentor_id" TEXT,
ADD COLUMN     "mentor_status" "logbook_approval_status" NOT NULL DEFAULT 'pending',
ADD COLUMN     "teacher_approved_at" TIMESTAMPTZ,
ADD COLUMN     "teacher_id" TEXT,
ADD COLUMN     "teacher_status" "logbook_approval_status" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "internship_placements" ADD COLUMN     "duration_days" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "daily_logbooks_mentor_status_idx" ON "daily_logbooks"("mentor_status");

-- CreateIndex
CREATE INDEX "daily_logbooks_teacher_status_idx" ON "daily_logbooks"("teacher_status");

-- AddForeignKey
ALTER TABLE "daily_logbooks" ADD CONSTRAINT "daily_logbooks_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "industry_mentors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logbooks" ADD CONSTRAINT "daily_logbooks_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
