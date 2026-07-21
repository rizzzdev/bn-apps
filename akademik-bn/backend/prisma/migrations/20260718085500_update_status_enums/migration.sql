-- Create new enum types
CREATE TYPE "ClassStudentStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Naik Kelas', 'Tinggal Kelas', 'Pindah', 'Lulus');
CREATE TYPE "MajorStudentStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Pindah', 'Lulus');
CREATE TYPE "SubjectTeacherStatus" AS ENUM ('Aktif', 'Tidak Aktif', 'Lulus');

-- Rename ActiveStatus value to include space
ALTER TYPE "ActiveStatus" RENAME VALUE 'TidakAktif' TO 'Tidak Aktif';

-- Add status column to shadow_academic_years
ALTER TABLE "shadow_academic_years" ADD COLUMN "status" "ActiveStatus" NOT NULL DEFAULT 'Aktif';

-- Migrate major_students to use MajorStudentStatus
ALTER TABLE "major_students" ALTER COLUMN "status" TYPE "MajorStudentStatus" USING (
  CASE "status"::text
    WHEN 'Aktif' THEN 'Aktif'::"MajorStudentStatus"
    WHEN 'TidakAktif' THEN 'Tidak Aktif'::"MajorStudentStatus"
    WHEN 'Lulus' THEN 'Lulus'::"MajorStudentStatus"
  END
);

-- Migrate class_students to use ClassStudentStatus
ALTER TABLE "class_students" ALTER COLUMN "status" TYPE "ClassStudentStatus" USING (
  CASE "status"::text
    WHEN 'Aktif' THEN 'Aktif'::"ClassStudentStatus"
    WHEN 'TidakAktif' THEN 'Tidak Aktif'::"ClassStudentStatus"
    WHEN 'Lulus' THEN 'Lulus'::"ClassStudentStatus"
  END
);

-- Migrate subject_teachers to use SubjectTeacherStatus
ALTER TABLE "subject_teachers" ALTER COLUMN "status" TYPE "SubjectTeacherStatus" USING (
  CASE "status"::text
    WHEN 'Aktif' THEN 'Aktif'::"SubjectTeacherStatus"
    WHEN 'TidakAktif' THEN 'Tidak Aktif'::"SubjectTeacherStatus"
    WHEN 'Lulus' THEN 'Lulus'::"SubjectTeacherStatus"
  END
);

-- Drop old StudentStatus enum
DROP TYPE IF EXISTS "StudentStatus";
