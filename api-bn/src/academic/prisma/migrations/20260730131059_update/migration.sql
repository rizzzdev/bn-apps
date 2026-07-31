-- CreateTable
CREATE TABLE "shadow_academic_years" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "semester_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
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
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "head_of_department" TEXT,
    "head_of_department_nip" TEXT,
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
    "major_code" TEXT,
    "academic_year" TEXT,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "homeroom_teacher" TEXT,
    "homeroom_teacher_nip" TEXT,
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
    "nip" TEXT,
    "subject" TEXT,
    "field" TEXT,
    "class" TEXT,
    "academic_year" TEXT,
    "phone" TEXT,
    "photo_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
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
    "nis" TEXT,
    "nisn" TEXT,
    "class_id" TEXT,
    "class_name" TEXT,
    "major_id" TEXT,
    "major_name" TEXT,
    "academic_year_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "photo_url" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_subjects_pkey" PRIMARY KEY ("id")
);
