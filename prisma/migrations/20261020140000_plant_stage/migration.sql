-- CreateEnum
CREATE TYPE "PlantStage" AS ENUM ('BUD', 'FLOWER', 'FRUIT', 'OVER');

-- AlterTable
ALTER TABLE "Specimen" ADD COLUMN "stage" "PlantStage",
ADD COLUMN "stageSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StageObservation" (
    "id" TEXT NOT NULL,
    "stage" "PlantStage" NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "specimenId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "StageObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StageObservation_specimenId_observedAt_idx" ON "StageObservation"("specimenId", "observedAt");

-- AddForeignKey
ALTER TABLE "StageObservation" ADD CONSTRAINT "StageObservation_specimenId_fkey" FOREIGN KEY ("specimenId") REFERENCES "Specimen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageObservation" ADD CONSTRAINT "StageObservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
