-- CreateEnum
CREATE TYPE "LessonScheduleStatus" AS ENUM ('Aktif', 'Tidak Aktif');

-- CreateTable
CREATE TABLE "lesson_schedules" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "notes" TEXT,
    "status" "LessonScheduleStatus" NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

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

-- AddForeignKey
ALTER TABLE "lesson_schedules" ADD CONSTRAINT "lesson_schedules_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "shadow_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedule_teachers" ADD CONSTRAINT "lesson_schedule_teachers_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "lesson_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedule_teachers" ADD CONSTRAINT "lesson_schedule_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedule_classes" ADD CONSTRAINT "lesson_schedule_classes_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "lesson_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_schedule_classes" ADD CONSTRAINT "lesson_schedule_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
