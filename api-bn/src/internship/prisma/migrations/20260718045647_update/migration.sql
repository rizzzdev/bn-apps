/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `teachers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "industry_mentors" DROP CONSTRAINT "industry_mentors_user_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_user_id_fkey";

-- DropForeignKey
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_user_id_fkey";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "email" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "email" VARCHAR(100) NOT NULL;

-- DropTable
DROP TABLE "users";

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");
