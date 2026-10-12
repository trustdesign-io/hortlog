-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "careAction" "WorkAction",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "specimenId" TEXT;

-- AlterTable
ALTER TABLE "WorkLogEntry" ADD COLUMN     "taskId" TEXT;

-- CreateIndex
CREATE INDEX "WorkLogEntry_taskId_idx" ON "WorkLogEntry"("taskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_specimenId_fkey" FOREIGN KEY ("specimenId") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogEntry" ADD CONSTRAINT "WorkLogEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Existing done tasks: treat their last update as the completion date
UPDATE "Task" SET "completedAt" = "updatedAt" WHERE status = 'DONE' AND "completedAt" IS NULL;
