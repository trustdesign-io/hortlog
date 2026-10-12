-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "careSpecimenIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "cells" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sceneId" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

