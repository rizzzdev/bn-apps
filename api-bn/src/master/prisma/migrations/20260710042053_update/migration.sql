/*
  Warnings:

  - The `gender` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `religion` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gender` column on the `teachers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `religion` column on the `teachers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `teachers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[user_id,type]` on the table `sentri_identifiers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Lulus');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Pensiun');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "current_class_id" TEXT,
ADD COLUMN     "current_major_id" TEXT,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender",
DROP COLUMN "religion",
ADD COLUMN     "religion" "Religion",
DROP COLUMN "status",
ADD COLUMN     "status" "StudentStatus";

-- AlterTable
ALTER TABLE "teachers" DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender",
DROP COLUMN "religion",
ADD COLUMN     "religion" "Religion",
DROP COLUMN "status",
ADD COLUMN     "status" "TeacherStatus";

-- CreateIndex
CREATE UNIQUE INDEX "sentri_identifiers_user_id_type_key" ON "sentri_identifiers"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_current_class_id_fkey" FOREIGN KEY ("current_class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_current_major_id_fkey" FOREIGN KEY ("current_major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
