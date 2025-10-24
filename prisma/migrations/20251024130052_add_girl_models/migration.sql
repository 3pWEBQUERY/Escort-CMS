-- CreateTable
CREATE TABLE "Girl" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Girl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GirlFieldValue" (
    "id" TEXT NOT NULL,
    "girlId" TEXT NOT NULL,
    "fieldSlug" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GirlFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GirlFieldValue_girlId_idx" ON "GirlFieldValue"("girlId");

-- CreateIndex
CREATE INDEX "GirlFieldValue_fieldSlug_idx" ON "GirlFieldValue"("fieldSlug");

-- AddForeignKey
ALTER TABLE "GirlFieldValue" ADD CONSTRAINT "GirlFieldValue_girlId_fkey" FOREIGN KEY ("girlId") REFERENCES "Girl"("id") ON DELETE CASCADE ON UPDATE CASCADE;
