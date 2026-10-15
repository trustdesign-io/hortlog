-- Whether a scene is in use at the venue. Pre-made scenes start inactive.
ALTER TABLE "Scene" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
