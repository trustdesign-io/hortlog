-- Gardens only appear in Find a garden once a manager lists them
ALTER TABLE "Organisation" ADD COLUMN "listed" BOOLEAN NOT NULL DEFAULT false;
