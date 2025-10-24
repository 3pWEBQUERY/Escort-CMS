-- AlterEnum
ALTER TYPE "GirlFieldType" ADD VALUE 'SECTION';

-- AlterTable
ALTER TABLE "GirlField" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "GirlField" ADD CONSTRAINT "GirlField_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GirlField"("id") ON DELETE SET NULL ON UPDATE CASCADE;
