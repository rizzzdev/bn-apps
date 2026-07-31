/*
  Warnings:

  - The values [rejected] on the enum `logbook_approval_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `time_in` on the `daily_logbooks` table. All the data in the column will be lost.
  - You are about to drop the column `time_out` on the `daily_logbooks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[attachment_id]` on the table `assessments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[student_id,company_id,start_date,status]` on the table `internship_placements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `activities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "attendance_type" AS ENUM ('check_in', 'check_out');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('accepted', 'declined');

-- CreateEnum
CREATE TYPE "review_action_type" AS ENUM ('revision', 'approved');

-- AlterEnum
BEGIN;
CREATE TYPE "logbook_approval_status_new" AS ENUM ('pending', 'approved');
ALTER TABLE "public"."daily_logbooks" ALTER COLUMN "mentor_status" DROP DEFAULT;
ALTER TABLE "public"."daily_logbooks" ALTER COLUMN "teacher_status" DROP DEFAULT;
ALTER TABLE "daily_logbooks" ALTER COLUMN "mentor_status" TYPE "logbook_approval_status_new" USING ("mentor_status"::text::"logbook_approval_status_new");
ALTER TABLE "daily_logbooks" ALTER COLUMN "teacher_status" TYPE "logbook_approval_status_new" USING ("teacher_status"::text::"logbook_approval_status_new");
ALTER TYPE "logbook_approval_status" RENAME TO "logbook_approval_status_old";
ALTER TYPE "logbook_approval_status_new" RENAME TO "logbook_approval_status";
DROP TYPE "public"."logbook_approval_status_old";
ALTER TABLE "daily_logbooks" ALTER COLUMN "mentor_status" SET DEFAULT 'pending';
ALTER TABLE "daily_logbooks" ALTER COLUMN "teacher_status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
ALTER TYPE "target_type" ADD VALUE 'attendance';

-- DropIndex
DROP INDEX "activities_actor_id_actor_type_idx";

-- DropIndex
DROP INDEX "activities_target_id_target_type_idx";

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "action" VARCHAR(100) NOT NULL,
ADD COLUMN     "placement_id" TEXT,
ALTER COLUMN "actor_type" DROP NOT NULL,
ALTER COLUMN "target_id" DROP NOT NULL,
ALTER COLUMN "target_type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "attachment_id" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "check_in_time" VARCHAR(10),
ADD COLUMN     "check_out_time" VARCHAR(10),
ADD COLUMN     "location_metadata" JSONB;

-- AlterTable
ALTER TABLE "daily_logbooks" DROP COLUMN "time_in",
DROP COLUMN "time_out";

-- AlterTable
ALTER TABLE "internship_placements" ADD COLUMN     "certificate_url" TEXT,
ADD COLUMN     "end_time" TIME,
ADD COLUMN     "start_time" TIME;

-- CreateTable
CREATE TABLE "logbook_reviews" (
    "id" TEXT NOT NULL,
    "logbook_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "action" "review_action_type" NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "logbook_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "attendance_type" NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME NOT NULL,
    "location_metadata" JSONB NOT NULL,
    "status" "attendance_status" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logbook_reviews_logbook_id_idx" ON "logbook_reviews"("logbook_id");

-- CreateIndex
CREATE INDEX "logbook_reviews_reviewer_id_idx" ON "logbook_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "logbook_reviews_deleted_at_idx" ON "logbook_reviews"("deleted_at");

-- CreateIndex
CREATE INDEX "attendances_placement_id_idx" ON "attendances"("placement_id");

-- CreateIndex
CREATE INDEX "attendances_student_id_idx" ON "attendances"("student_id");

-- CreateIndex
CREATE INDEX "attendances_placement_id_date_idx" ON "attendances"("placement_id", "date");

-- CreateIndex
CREATE INDEX "attendances_deleted_at_idx" ON "attendances"("deleted_at");

-- CreateIndex
CREATE INDEX "activities_placement_id_idx" ON "activities"("placement_id");

-- CreateIndex
CREATE INDEX "activities_actor_id_idx" ON "activities"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_attachment_id_key" ON "assessments"("attachment_id");

-- CreateIndex
CREATE UNIQUE INDEX "internship_placements_student_id_company_id_start_date_stat_key" ON "internship_placements"("student_id", "company_id", "start_date", "status");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_reviews" ADD CONSTRAINT "logbook_reviews_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "daily_logbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "internship_placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "internship_placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
