-- CreateEnum
CREATE TYPE "GirlFieldType" AS ENUM ('SELECT', 'SELECT_SEARCH', 'MULTISELECT', 'INPUT', 'TEXTAREA', 'NUMBER');

-- CreateTable
CREATE TABLE "GirlField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "GirlFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GirlField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GirlField_slug_key" ON "GirlField"("slug");
