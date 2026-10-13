-- Organisation location for the weather bar: a UK postcode and its coordinates.
ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "postcode" TEXT;
ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
