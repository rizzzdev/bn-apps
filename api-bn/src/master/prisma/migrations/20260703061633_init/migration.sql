-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Selesai');

-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('Ganjil', 'Genap');

-- CreateTable
CREATE TABLE "sentri_identifiers" (
    "id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentri_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentri_sessions" (
    "id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "replaced_by" VARCHAR(36),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentri_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentri_users" (
    "id" VARCHAR(36) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "roles" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentri_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "status" "AcademicStatus" NOT NULL DEFAULT 'Tidak Aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "type" "SemesterType" NOT NULL,
    "status" "AcademicStatus" NOT NULL DEFAULT 'Tidak Aktif',
    "academic_year_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "majors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "nik" TEXT,
    "birthplace" TEXT,
    "birthdate" TIMESTAMP(3),
    "gender" TEXT,
    "religion" TEXT,
    "ethnic_group" TEXT,
    "status" TEXT,
    "prefix_title" TEXT,
    "suffix_title" TEXT,
    "nip" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "phone_number" TEXT,
    "email" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "nik" TEXT,
    "birthplace" TEXT,
    "birthdate" TIMESTAMP(3),
    "gender" TEXT,
    "religion" TEXT,
    "ethnic_group" TEXT,
    "status" TEXT,
    "nis" TEXT,
    "nisn" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "phone_number" TEXT,
    "email" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sentri_identifiers_value_key" ON "sentri_identifiers"("value");

-- CreateIndex
CREATE INDEX "idx_sentri_identifiers_user_id" ON "sentri_identifiers"("user_id");

-- CreateIndex
CREATE INDEX "idx_sentri_sessions_user_id" ON "sentri_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_code_key" ON "academic_years"("code");

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "majors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_nik_key" ON "teachers"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_nip_key" ON "teachers"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_nik_key" ON "students"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "students_nis_key" ON "students"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "students_nisn_key" ON "students"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- AddForeignKey
ALTER TABLE "sentri_identifiers" ADD CONSTRAINT "sentri_identifiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sentri_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sentri_sessions" ADD CONSTRAINT "sentri_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sentri_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
