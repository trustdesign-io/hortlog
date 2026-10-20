-- CreateEnum
CREATE TYPE "LabelProblem" AS ENUM ('MISSING', 'DAMAGED', 'WRONG_NAME', 'HIDDEN');

-- CreateTable
CREATE TABLE "LabelReport" (
    "id" TEXT NOT NULL,
    "problem" "LabelProblem" NOT NULL,
    "note" TEXT,
    "fromVisitor" BOOLEAN NOT NULL DEFAULT false,
    "visitorKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "specimenId" TEXT NOT NULL,
    "userId" TEXT,
    "taskId" TEXT,

    CONSTRAINT "LabelReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabelReport_specimenId_idx" ON "LabelReport"("specimenId");

-- CreateIndex
CREATE INDEX "LabelReport_taskId_idx" ON "LabelReport"("taskId");

-- CreateIndex
CREATE INDEX "LabelReport_visitorKey_createdAt_idx" ON "LabelReport"("visitorKey", "createdAt");

-- AddForeignKey
ALTER TABLE "LabelReport" ADD CONSTRAINT "LabelReport_specimenId_fkey" FOREIGN KEY ("specimenId") REFERENCES "Specimen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelReport" ADD CONSTRAINT "LabelReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelReport" ADD CONSTRAINT "LabelReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
