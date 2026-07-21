/*
  Warnings:

  - You are about to drop the column `actor_type` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `placement_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `activities` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_placement_id_fkey";

-- DropIndex
DROP INDEX "activities_placement_id_idx";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "actor_type",
DROP COLUMN "placement_id",
DROP COLUMN "target_type",
ADD COLUMN     "is_for_admin" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "actor_id" DROP NOT NULL,
ALTER COLUMN "action" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "activities_target_id_idx" ON "activities"("target_id");

-- CreateIndex
CREATE INDEX "activities_is_for_admin_idx" ON "activities"("is_for_admin");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
