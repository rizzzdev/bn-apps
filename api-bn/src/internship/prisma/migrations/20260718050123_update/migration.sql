/*
  Warnings:

  - A unique constraint covering the columns `[email,deleted_at]` on the table `industry_mentors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,deleted_at]` on the table `industry_mentors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[company_id,deleted_at]` on the table `industry_mentors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,deleted_at]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,deleted_at]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nisn,deleted_at]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,deleted_at]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,deleted_at]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "industry_mentors_user_id_key";

-- DropIndex
DROP INDEX "students_email_key";

-- DropIndex
DROP INDEX "students_nisn_key";

-- DropIndex
DROP INDEX "students_user_id_key";

-- DropIndex
DROP INDEX "teachers_email_key";

-- DropIndex
DROP INDEX "teachers_user_id_key";

-- AlterTable
ALTER TABLE "industry_mentors" ADD COLUMN     "email" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "industry_mentors_email_deleted_at_key" ON "industry_mentors"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "industry_mentors_user_id_deleted_at_key" ON "industry_mentors"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "industry_mentors_company_id_deleted_at_key" ON "industry_mentors"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_deleted_at_key" ON "students"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_deleted_at_key" ON "students"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_nisn_deleted_at_key" ON "students"("nisn", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_deleted_at_key" ON "teachers"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_deleted_at_key" ON "teachers"("user_id", "deleted_at");
