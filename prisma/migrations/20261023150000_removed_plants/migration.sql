-- A plant no longer in the garden is marked removed rather than deleted, so its records stay
ALTER TABLE "Specimen" ADD COLUMN "removedAt" TIMESTAMP(3);
ALTER TABLE "Specimen" ADD COLUMN "removedNote" TEXT;
