/*
  Warnings:

  - You are about to drop the `academic_years` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `majors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teachers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_major_id_fkey";

-- DropTable
DROP TABLE "academic_years";

-- DropTable
DROP TABLE "classes";

-- DropTable
DROP TABLE "majors";

-- DropTable
DROP TABLE "students";

-- DropTable
DROP TABLE "subjects";

-- DropTable
DROP TABLE "teachers";

-- CreateTable
CREATE TABLE "shadow_academic_years" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "semesterType" "SemesterType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_majors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_teachers" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "gender" "Gender",
    "nip" TEXT,
    "email" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_students" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "gender" "Gender",
    "nis" TEXT,
    "nisn" TEXT,
    "email" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shadow_teachers_user_id_key" ON "shadow_teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shadow_students_user_id_key" ON "shadow_students"("user_id");

-- AddForeignKey
ALTER TABLE "shadow_classes" ADD CONSTRAINT "shadow_classes_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "shadow_majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
