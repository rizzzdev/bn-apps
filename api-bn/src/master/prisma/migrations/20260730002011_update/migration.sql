/*
  Warnings:

  - You are about to drop the `sentri_identifiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sentri_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sentri_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sentri_identifiers" DROP CONSTRAINT "sentri_identifiers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sentri_sessions" DROP CONSTRAINT "sentri_sessions_user_id_fkey";

-- DropTable
DROP TABLE "sentri_identifiers";

-- DropTable
DROP TABLE "sentri_sessions";

-- DropTable
DROP TABLE "sentri_users";

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "material_icon" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);
