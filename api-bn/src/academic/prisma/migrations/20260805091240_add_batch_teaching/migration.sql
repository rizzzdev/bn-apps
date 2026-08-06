-- AlterTable
ALTER TABLE "class_subject_requirements" ADD COLUMN     "batch_group_id" TEXT,
ADD COLUMN     "batch_weekly_hours" INTEGER NOT NULL DEFAULT 0;
