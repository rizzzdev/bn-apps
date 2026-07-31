/*
  Warnings:

  - You are about to drop the column `class_id` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `class_id` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `class_id` on the `quizzes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('Draft', 'Published');

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_class_id_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_class_id_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_class_id_fkey";

-- AlterTable
ALTER TABLE "assignment_submissions" ALTER COLUMN "file_url" DROP NOT NULL,
ALTER COLUMN "file_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "class_id",
ADD COLUMN     "status" "MaterialStatus" NOT NULL DEFAULT 'Draft';

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "class_id",
ADD COLUMN     "status" "MaterialStatus" NOT NULL DEFAULT 'Draft';

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "class_id",
ADD COLUMN     "status" "MaterialStatus" NOT NULL DEFAULT 'Draft';

-- CreateTable
CREATE TABLE "material_classes" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,

    CONSTRAINT "material_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_classes" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_classes" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,

    CONSTRAINT "quiz_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_reads" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_classes_material_id_class_id_key" ON "material_classes"("material_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_classes_assignment_id_class_id_key" ON "assignment_classes"("assignment_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_classes_quiz_id_class_id_key" ON "quiz_classes"("quiz_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "material_reads_material_id_student_id_key" ON "material_reads"("material_id", "student_id");

-- AddForeignKey
ALTER TABLE "material_classes" ADD CONSTRAINT "material_classes_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_classes" ADD CONSTRAINT "material_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_classes" ADD CONSTRAINT "assignment_classes_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_classes" ADD CONSTRAINT "assignment_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_classes" ADD CONSTRAINT "quiz_classes_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_classes" ADD CONSTRAINT "quiz_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reads" ADD CONSTRAINT "material_reads_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reads" ADD CONSTRAINT "material_reads_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "shadow_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
