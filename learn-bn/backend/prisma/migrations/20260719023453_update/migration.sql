-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('Ganjil', 'Genap');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('Aktif', 'Tidak Aktif');

-- CreateEnum
CREATE TYPE "ClassStudentStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Naik Kelas', 'Tinggal Kelas', 'Pindah', 'Lulus');

-- CreateEnum
CREATE TYPE "MajorStudentStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Pindah', 'Lulus');

-- CreateEnum
CREATE TYPE "SubjectTeacherStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Lulus');

-- CreateTable
CREATE TABLE "shadow_academic_years" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "semesterType" "SemesterType" NOT NULL,
    "status" "ActiveStatus" NOT NULL DEFAULT 'Aktif',
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
    "prefix_title" TEXT,
    "suffix_title" TEXT,
    "gender" "Gender",
    "nip" TEXT,
    "email" TEXT,
    "user_id" TEXT NOT NULL,
    "picture_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
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
    "picture_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
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

-- CreateTable
CREATE TABLE "shadow_major_students" (
    "id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "MajorStudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_major_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_class_students" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "ClassStudentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_subject_teachers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" "SubjectTeacherStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_subject_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shadow_teachers_user_id_key" ON "shadow_teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shadow_students_user_id_key" ON "shadow_students"("user_id");

-- AddForeignKey
ALTER TABLE "shadow_classes" ADD CONSTRAINT "shadow_classes_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "shadow_majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "shadow_subject_teachers" ADD CONSTRAINT "shadow_subject_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_subject_teachers" ADD CONSTRAINT "shadow_subject_teachers_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "shadow_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
