-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('admin', 'teacher', 'student', 'industry_mentor');

-- CreateEnum
CREATE TYPE "target_type" AS ENUM ('assessment', 'attachment', 'company', 'daily_logbook', 'industry_mentor', 'internship_placement', 'student', 'teacher', 'user');

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "format" VARCHAR(50) NOT NULL,
    "size" DECIMAL(10,2) NOT NULL,
    "url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_type" "actor_type" NOT NULL,
    "description" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" "target_type" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_deleted_at_idx" ON "attachments"("deleted_at");

-- CreateIndex
CREATE INDEX "activities_actor_id_actor_type_idx" ON "activities"("actor_id", "actor_type");

-- CreateIndex
CREATE INDEX "activities_target_id_target_type_idx" ON "activities"("target_id", "target_type");

-- CreateIndex
CREATE INDEX "activities_deleted_at_idx" ON "activities"("deleted_at");
