-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('Aktif', 'Tidak Aktif');

-- CreateEnum
CREATE TYPE "ClassStudentStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Naik Kelas', 'Tinggal Kelas', 'Pindah', 'Lulus');

-- CreateEnum
CREATE TYPE "MajorStudentStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Pindah', 'Lulus');

-- CreateEnum
CREATE TYPE "SubjectTeacherStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Lulus');

-- CreateEnum
CREATE TYPE "LessonScheduleStatus" AS ENUM ('Aktif', 'Tidak Aktif');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('Ganjil', 'Genap');

-- CreateTable
CREATE TABLE "lesson_hours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lesson_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "major_students" (
    "id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "MajorStudentStatus" NOT NULL,
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
    "status" "ClassStudentStatus" NOT NULL,
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
CREATE TABLE "major_heads" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "ActiveStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "major_heads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_teachers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" "SubjectTeacherStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "target_hours" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subject_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_schedules" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "notes" TEXT,
    "status" "LessonScheduleStatus" NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "lesson_hour_id" TEXT NOT NULL,

    CONSTRAINT "lesson_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_schedule_teachers" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lesson_schedule_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_schedule_classes" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lesson_schedule_classes_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "class_subject_requirements" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "weekly_hours" INTEGER NOT NULL DEFAULT 2,
    "max_hours_per_day" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "class_subject_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_unavailabilities" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "lesson_hour_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teacher_unavailabilities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lesson_schedules" ADD CONSTRAINT "lesson_schedules_lesson_hour_id_fkey" FOREIGN KEY ("lesson_hour_id") REFERENCES "lesson_hours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedule_teachers" ADD CONSTRAINT "lesson_schedule_teachers_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "lesson_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedule_classes" ADD CONSTRAINT "lesson_schedule_classes_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "lesson_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_unavailabilities" ADD CONSTRAINT "teacher_unavailabilities_lesson_hour_id_fkey" FOREIGN KEY ("lesson_hour_id") REFERENCES "lesson_hours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
