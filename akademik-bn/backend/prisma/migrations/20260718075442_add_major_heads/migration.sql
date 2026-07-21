-- CreateTable
CREATE TABLE "major_heads" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" "ActiveStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "major_heads_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "major_heads" ADD CONSTRAINT "major_heads_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "shadow_teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "major_heads" ADD CONSTRAINT "major_heads_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "shadow_majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "major_heads" ADD CONSTRAINT "major_heads_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "shadow_academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
