-- Scene perspective: a bed lies on the ground and recedes, a wall stands upright.
BEGIN;
CREATE TYPE "ScenePerspective" AS ENUM ('BED', 'WALL');
ALTER TABLE "Scene" ADD COLUMN "perspective" "ScenePerspective" NOT NULL DEFAULT 'BED';
COMMIT;
