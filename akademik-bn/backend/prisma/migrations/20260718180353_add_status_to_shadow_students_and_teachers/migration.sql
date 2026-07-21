-- AlterTable
ALTER TABLE "shadow_students" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Aktif';

-- AlterTable
ALTER TABLE "shadow_teachers" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Aktif';
