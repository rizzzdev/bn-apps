/*
  Warnings:

  - The values [user] on the enum `target_type` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `email` on table `industry_mentors` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "target_type_new" AS ENUM ('assessment', 'attachment', 'attendance', 'company', 'daily_logbook', 'industry_mentor', 'internship_placement', 'student', 'teacher');
ALTER TYPE "target_type" RENAME TO "target_type_old";
ALTER TYPE "target_type_new" RENAME TO "target_type";
DROP TYPE "public"."target_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "industry_mentors" ALTER COLUMN "email" SET NOT NULL;
