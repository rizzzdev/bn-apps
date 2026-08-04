-- CreateTable
CREATE TABLE "schedule_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "start_hour_id" TEXT NOT NULL,
    "duration_hours" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_start_hour_id_fkey" FOREIGN KEY ("start_hour_id") REFERENCES "lesson_hours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
