/*
  Warnings:

  - You are about to drop the `shadow_class_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shadow_homeroom_teachers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shadow_major_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shadow_subject_teachers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shadow_teacher_picket_schedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "shadow_class_students" DROP CONSTRAINT "shadow_class_students_academic_year_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_class_students" DROP CONSTRAINT "shadow_class_students_class_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_class_students" DROP CONSTRAINT "shadow_class_students_student_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_homeroom_teachers" DROP CONSTRAINT "shadow_homeroom_teachers_academic_year_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_homeroom_teachers" DROP CONSTRAINT "shadow_homeroom_teachers_class_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_homeroom_teachers" DROP CONSTRAINT "shadow_homeroom_teachers_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_major_students" DROP CONSTRAINT "shadow_major_students_academic_year_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_major_students" DROP CONSTRAINT "shadow_major_students_major_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_major_students" DROP CONSTRAINT "shadow_major_students_student_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_subject_teachers" DROP CONSTRAINT "shadow_subject_teachers_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_subject_teachers" DROP CONSTRAINT "shadow_subject_teachers_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "shadow_teacher_picket_schedules" DROP CONSTRAINT "shadow_teacher_picket_schedules_teacher_id_fkey";

-- DropTable
DROP TABLE "shadow_class_students";

-- DropTable
DROP TABLE "shadow_homeroom_teachers";

-- DropTable
DROP TABLE "shadow_major_students";

-- DropTable
DROP TABLE "shadow_subject_teachers";

-- DropTable
DROP TABLE "shadow_teacher_picket_schedules";

-- CreateTable
CREATE TABLE "major_students" (
    "id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "major_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_students" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeroom_teachers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "ActiveStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "homeroom_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_teachers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subject_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_picket_schedules" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "status" "ActiveStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teacher_picket_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "major_students" ADD CONSTRAINT "major_students_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "shadow_majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "major_students" ADD CONSTRAINT "major_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "shadow_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "major_students" ADD CONSTRAINT "major_students_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "shadow_academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "shadow_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "shadow_academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeroom_teachers" ADD CONSTRAINT "homeroom_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeroom_teachers" ADD CONSTRAINT "homeroom_teachers_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeroom_teachers" ADD CONSTRAINT "homeroom_teachers_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "shadow_academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "shadow_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_picket_schedules" ADD CONSTRAINT "teacher_picket_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
