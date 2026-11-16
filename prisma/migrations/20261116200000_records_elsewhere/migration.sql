-- A work record can be a plant worked at a site not on hortlog: no specimen or garden, just the species and site text
ALTER TABLE "WorkRecord" ALTER COLUMN "specimenId" DROP NOT NULL,
ALTER COLUMN "organisationId" DROP NOT NULL,
ADD COLUMN "speciesId" TEXT;

-- CreateIndex
CREATE INDEX "WorkRecord_speciesId_idx" ON "WorkRecord"("speciesId");

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE SET NULL ON UPDATE CASCADE;
