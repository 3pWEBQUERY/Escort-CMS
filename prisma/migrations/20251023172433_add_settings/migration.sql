-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "siteName" TEXT NOT NULL,
    "siteDescription" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "dateFormat" TEXT NOT NULL,
    "timeFormat" TEXT NOT NULL,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "defaultRole" TEXT NOT NULL DEFAULT 'author',
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT true,
    "enableTwoFactorAuth" BOOLEAN NOT NULL DEFAULT false,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
