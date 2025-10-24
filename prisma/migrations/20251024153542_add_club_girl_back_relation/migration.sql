-- AlterTable
ALTER TABLE "Girl" ADD COLUMN     "clubId" TEXT;

-- CreateIndex
CREATE INDEX "Girl_clubId_idx" ON "Girl"("clubId");

-- AddForeignKey
ALTER TABLE "Girl" ADD CONSTRAINT "Girl_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
