-- CreateEnum
CREATE TYPE "placement_status" AS ENUM ('active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "logbook_approval_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "assessor_type" AS ENUM ('teacher', 'industry_mentor');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nisn" VARCHAR(20),
    "name" VARCHAR(150) NOT NULL,
    "class_name" VARCHAR(50),
    "major" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT,
    "contact_person" VARCHAR(150),
    "phone" VARCHAR(30),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_mentors" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "user_id" TEXT,
    "name" VARCHAR(150) NOT NULL,
    "position" VARCHAR(100),
    "phone" VARCHAR(30),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "industry_mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_placements" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "industry_mentor_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "placement_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "internship_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logbooks" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time_in" TIME NOT NULL,
    "time_out" TIME,
    "activity_title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "photo_path" VARCHAR(500),
    "status_approval" "logbook_approval_status" NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "mentor_feedback" TEXT,
    "teacher_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "daily_logbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "assessor_type" "assessor_type" NOT NULL,
    "teacher_id" TEXT,
    "industry_mentor_id" TEXT,
    "technical_score" DECIMAL(5,2),
    "non_technical_score" DECIMAL(5,2),
    "final_score" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_nisn_key" ON "students"("nisn");

-- CreateIndex
CREATE INDEX "students_user_id_idx" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_deleted_at_idx" ON "students"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE INDEX "teachers_user_id_idx" ON "teachers"("user_id");

-- CreateIndex
CREATE INDEX "teachers_deleted_at_idx" ON "teachers"("deleted_at");

-- CreateIndex
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "industry_mentors_user_id_key" ON "industry_mentors"("user_id");

-- CreateIndex
CREATE INDEX "industry_mentors_company_id_idx" ON "industry_mentors"("company_id");

-- CreateIndex
CREATE INDEX "industry_mentors_user_id_idx" ON "industry_mentors"("user_id");

-- CreateIndex
CREATE INDEX "industry_mentors_deleted_at_idx" ON "industry_mentors"("deleted_at");

-- CreateIndex
CREATE INDEX "internship_placements_student_id_idx" ON "internship_placements"("student_id");

-- CreateIndex
CREATE INDEX "internship_placements_teacher_id_idx" ON "internship_placements"("teacher_id");

-- CreateIndex
CREATE INDEX "internship_placements_industry_mentor_id_idx" ON "internship_placements"("industry_mentor_id");

-- CreateIndex
CREATE INDEX "internship_placements_deleted_at_idx" ON "internship_placements"("deleted_at");

-- CreateIndex
CREATE INDEX "daily_logbooks_placement_id_idx" ON "daily_logbooks"("placement_id");

-- CreateIndex
CREATE INDEX "daily_logbooks_placement_id_date_idx" ON "daily_logbooks"("placement_id", "date");

-- CreateIndex
CREATE INDEX "daily_logbooks_status_approval_idx" ON "daily_logbooks"("status_approval");

-- CreateIndex
CREATE INDEX "daily_logbooks_deleted_at_idx" ON "daily_logbooks"("deleted_at");

-- CreateIndex
CREATE INDEX "assessments_placement_id_idx" ON "assessments"("placement_id");

-- CreateIndex
CREATE INDEX "assessments_deleted_at_idx" ON "assessments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_placement_id_assessor_type_key" ON "assessments"("placement_id", "assessor_type");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_mentors" ADD CONSTRAINT "industry_mentors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_mentors" ADD CONSTRAINT "industry_mentors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_placements" ADD CONSTRAINT "internship_placements_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_placements" ADD CONSTRAINT "internship_placements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_placements" ADD CONSTRAINT "internship_placements_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_placements" ADD CONSTRAINT "internship_placements_industry_mentor_id_fkey" FOREIGN KEY ("industry_mentor_id") REFERENCES "industry_mentors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logbooks" ADD CONSTRAINT "daily_logbooks_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "internship_placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logbooks" ADD CONSTRAINT "daily_logbooks_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "industry_mentors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "internship_placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_industry_mentor_id_fkey" FOREIGN KEY ("industry_mentor_id") REFERENCES "industry_mentors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
