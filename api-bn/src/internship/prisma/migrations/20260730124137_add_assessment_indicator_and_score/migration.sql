-- CreateTable
CREATE TABLE "assessment_indicators" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "assessment_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_scores" (
    "id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "assessor_type" "assessor_type" NOT NULL,
    "assessor_id" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "assessment_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_indicators_placement_id_idx" ON "assessment_indicators"("placement_id");

-- CreateIndex
CREATE INDEX "assessment_indicators_deleted_at_idx" ON "assessment_indicators"("deleted_at");

-- CreateIndex
CREATE INDEX "assessment_scores_indicator_id_idx" ON "assessment_scores"("indicator_id");

-- CreateIndex
CREATE INDEX "assessment_scores_assessor_id_idx" ON "assessment_scores"("assessor_id");

-- CreateIndex
CREATE INDEX "assessment_scores_deleted_at_idx" ON "assessment_scores"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_scores_indicator_id_assessor_type_key" ON "assessment_scores"("indicator_id", "assessor_type");

-- AddForeignKey
ALTER TABLE "assessment_indicators" ADD CONSTRAINT "assessment_indicators_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "internship_placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_scores" ADD CONSTRAINT "assessment_scores_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "assessment_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
