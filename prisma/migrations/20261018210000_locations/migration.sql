-- AlterTable
ALTER TABLE "Scene" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "Specimen" ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organisationId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Location_organisationId_idx" ON "Location"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_organisationId_parentId_name_key" ON "Location"("organisationId", "parentId", "name");

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specimen" ADD CONSTRAINT "Specimen_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

