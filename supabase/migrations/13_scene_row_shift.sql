-- Which alternate rows of a scene's hex grid are offset; flips when a row is
-- added or removed at the top so existing rows keep their place.
ALTER TABLE "Scene" ADD COLUMN IF NOT EXISTS "rowShift" INTEGER NOT NULL DEFAULT 0;
