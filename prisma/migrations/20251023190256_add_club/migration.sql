-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "zipAndCity" TEXT NOT NULL,
    "logoPath" TEXT,
    "watermarkPath" TEXT,
    "clubPhone" TEXT,
    "clubMobile" TEXT,
    "clubMobileWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "clubEmail" TEXT,
    "jobPhone" TEXT,
    "jobMobile" TEXT,
    "jobMobileWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "jobEmail" TEXT,
    "jobContactPerson" TEXT,
    "openingHours" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);
