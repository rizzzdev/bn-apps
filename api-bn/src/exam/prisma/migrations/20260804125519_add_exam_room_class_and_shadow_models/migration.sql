-- AlterTable
ALTER TABLE "exam_participant" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "exam_room_class" (
    "id" TEXT NOT NULL,
    "exam_room_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exam_room_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
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
CREATE INDEX "exam_room_class_exam_room_id_idx" ON "exam_room_class"("exam_room_id");

-- CreateIndex
CREATE INDEX "exam_room_class_class_id_idx" ON "exam_room_class"("class_id");

-- CreateIndex
CREATE INDEX "exam_room_class_deleted_at_idx" ON "exam_room_class"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "exam_room_class_exam_room_id_class_id_key" ON "exam_room_class"("exam_room_id", "class_id");

-- CreateIndex
CREATE INDEX "shadow_classes_deleted_at_idx" ON "shadow_classes"("deleted_at");

-- CreateIndex
CREATE INDEX "shadow_class_students_class_id_idx" ON "shadow_class_students"("class_id");

-- CreateIndex
CREATE INDEX "shadow_class_students_student_id_idx" ON "shadow_class_students"("student_id");

-- CreateIndex
CREATE INDEX "shadow_class_students_deleted_at_idx" ON "shadow_class_students"("deleted_at");

-- CreateIndex
CREATE INDEX "exam_participant_deleted_at_idx" ON "exam_participant"("deleted_at");

-- AddForeignKey
ALTER TABLE "exam_room_class" ADD CONSTRAINT "exam_room_class_exam_room_id_fkey" FOREIGN KEY ("exam_room_id") REFERENCES "exam_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
