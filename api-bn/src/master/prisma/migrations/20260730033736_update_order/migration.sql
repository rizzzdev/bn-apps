-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "order" INTEGER;

-- CreateIndex
CREATE INDEX "applications_order_idx" ON "applications"("order");
