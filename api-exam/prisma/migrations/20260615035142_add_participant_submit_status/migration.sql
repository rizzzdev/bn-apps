-- CreateEnum
CREATE TYPE "ParticipantSubmitStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED');

-- AlterTable
ALTER TABLE "exam_participant" ADD COLUMN     "status" "ParticipantSubmitStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';
