-- CreateEnum
CREATE TYPE "public"."irrigation_method" AS ENUM ('DRIP', 'SPRINKLER', 'FLOOD', 'FURROW', 'MANUAL', 'RAINFED');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "public"."farmer_profiles" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "soilType" TEXT NOT NULL,
    "sowingDate" TIMESTAMP(3) NOT NULL,
    "hasStorageCapacity" BOOLEAN NOT NULL,
    "storageCapacity" DOUBLE PRECISION,
    "irrigationMethod" "public"."irrigation_method" NOT NULL,
    "farmingExperience" INTEGER,
    "farmSize" DOUBLE PRECISION,
    "previousYield" DOUBLE PRECISION,
    "preferredLanguage" TEXT DEFAULT 'en',
    "isOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farmer_profiles_userId_key" ON "public"."farmer_profiles"("userId");

-- AddForeignKey
ALTER TABLE "public"."farmer_profiles" ADD CONSTRAINT "farmer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
