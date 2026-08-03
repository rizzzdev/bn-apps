-- CreateTable
CREATE TABLE "shadow_students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "nis" TEXT,
    "nisn" TEXT,
    "picture_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT,
    "nip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "major_id" TEXT,
    "academic_year_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_class_students" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_class_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shadow_students_user_id_idx" ON "shadow_students"("user_id");

-- CreateIndex
CREATE INDEX "shadow_students_deleted_at_idx" ON "shadow_students"("deleted_at");

-- CreateIndex
CREATE INDEX "shadow_teachers_user_id_idx" ON "shadow_teachers"("user_id");

-- CreateIndex
CREATE INDEX "shadow_teachers_deleted_at_idx" ON "shadow_teachers"("deleted_at");

-- CreateIndex
CREATE INDEX "shadow_classes_deleted_at_idx" ON "shadow_classes"("deleted_at");

-- CreateIndex
CREATE INDEX "shadow_class_students_class_id_idx" ON "shadow_class_students"("class_id");

-- CreateIndex
CREATE INDEX "shadow_class_students_student_id_idx" ON "shadow_class_students"("student_id");

-- CreateIndex
CREATE INDEX "shadow_class_students_deleted_at_idx" ON "shadow_class_students"("deleted_at");
