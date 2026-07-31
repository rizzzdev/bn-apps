CREATE UNIQUE INDEX "majors_code_key" ON "majors"("code") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "majors_name_key" ON "majors"("name") WHERE "deleted_at" IS NULL;