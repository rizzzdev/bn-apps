-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('Aktif', 'TidakAktif', 'Lulus');

-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('Aktif', 'TidakAktif');

-- CreateTable
CREATE TABLE "shadow_major_students" (
    "id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_major_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_class_students" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_homeroom_teachers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "ActiveStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_homeroom_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_subject_teachers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_subject_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_teacher_picket_schedules" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "status" "ActiveStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_teacher_picket_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shadow_major_students" ADD CONSTRAINT "shadow_major_students_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "shadow_majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_major_students" ADD CONSTRAINT "shadow_major_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "shadow_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_major_students" ADD CONSTRAINT "shadow_major_students_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "shadow_academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_class_students" ADD CONSTRAINT "shadow_class_students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_class_students" ADD CONSTRAINT "shadow_class_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "shadow_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_class_students" ADD CONSTRAINT "shadow_class_students_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "shadow_academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_homeroom_teachers" ADD CONSTRAINT "shadow_homeroom_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_homeroom_teachers" ADD CONSTRAINT "shadow_homeroom_teachers_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_homeroom_teachers" ADD CONSTRAINT "shadow_homeroom_teachers_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "shadow_academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_subject_teachers" ADD CONSTRAINT "shadow_subject_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_subject_teachers" ADD CONSTRAINT "shadow_subject_teachers_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "shadow_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_teacher_picket_schedules" ADD CONSTRAINT "shadow_teacher_picket_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
