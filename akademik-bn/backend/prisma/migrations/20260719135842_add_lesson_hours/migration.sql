-- CreateTable: lesson_hours
CREATE TABLE "lesson_hours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "lesson_hours_pkey" PRIMARY KEY ("id")
);

-- Seed default lesson hours
INSERT INTO "lesson_hours" ("id", "name", "start_time", "end_time", "order") VALUES
    (gen_random_uuid()::text, 'Jam ke-1', '07:00', '07:45', 1),
    (gen_random_uuid()::text, 'Jam ke-2', '07:45', '08:30', 2),
    (gen_random_uuid()::text, 'Jam ke-3', '08:30', '09:15', 3),
    (gen_random_uuid()::text, 'Jam ke-4', '09:15', '10:00', 4),
    (gen_random_uuid()::text, 'Jam ke-5', '10:00', '10:45', 5),
    (gen_random_uuid()::text, 'Jam ke-6', '10:45', '11:30', 6),
    (gen_random_uuid()::text, 'Jam ke-7', '11:30', '12:15', 7),
    (gen_random_uuid()::text, 'Jam ke-8', '12:15', '13:00', 8),
    (gen_random_uuid()::text, 'Jam ke-9', '13:00', '13:45', 9),
    (gen_random_uuid()::text, 'Jam ke-10', '13:45', '14:30', 10);

-- AlterTable: add lesson_hour_id, migrate existing rows, then drop old columns
ALTER TABLE "lesson_schedules" ADD COLUMN "lesson_hour_id" TEXT;

-- Assign first lesson hour to existing rows
UPDATE "lesson_schedules" SET "lesson_hour_id" = (SELECT "id" FROM "lesson_hours" ORDER BY "order" LIMIT 1);

ALTER TABLE "lesson_schedules" ALTER COLUMN "lesson_hour_id" SET NOT NULL;

ALTER TABLE "lesson_schedules" DROP COLUMN "start_time";
ALTER TABLE "lesson_schedules" DROP COLUMN "end_time";

-- AddForeignKey
ALTER TABLE "lesson_schedules" ADD CONSTRAINT "lesson_schedules_lesson_hour_id_fkey" FOREIGN KEY ("lesson_hour_id") REFERENCES "lesson_hours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
