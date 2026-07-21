-- CreateTable
CREATE TABLE "shadow_lesson_hours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_lesson_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_lesson_schedules" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "lesson_hour_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ActiveStatus" NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "shadow_lesson_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_lesson_schedule_teachers" (
    "id" TEXT NOT NULL,
    "lesson_schedule_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_lesson_schedule_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_lesson_schedule_classes" (
    "id" TEXT NOT NULL,
    "lesson_schedule_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shadow_lesson_schedule_classes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shadow_lesson_schedules" ADD CONSTRAINT "shadow_lesson_schedules_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "shadow_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_lesson_schedules" ADD CONSTRAINT "shadow_lesson_schedules_lesson_hour_id_fkey" FOREIGN KEY ("lesson_hour_id") REFERENCES "shadow_lesson_hours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_lesson_schedule_teachers" ADD CONSTRAINT "shadow_lesson_schedule_teachers_lesson_schedule_id_fkey" FOREIGN KEY ("lesson_schedule_id") REFERENCES "shadow_lesson_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_lesson_schedule_teachers" ADD CONSTRAINT "shadow_lesson_schedule_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_lesson_schedule_classes" ADD CONSTRAINT "shadow_lesson_schedule_classes_lesson_schedule_id_fkey" FOREIGN KEY ("lesson_schedule_id") REFERENCES "shadow_lesson_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_lesson_schedule_classes" ADD CONSTRAINT "shadow_lesson_schedule_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "shadow_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
