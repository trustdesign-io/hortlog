-- Scene zones (PR #197) were reverted in #198. Remove what that change added.
BEGIN;
ALTER TABLE "Specimen" DROP CONSTRAINT IF EXISTS "Specimen_zoneId_fkey";
ALTER TABLE "Specimen" DROP COLUMN IF EXISTS "zoneId";
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_zoneId_fkey";
ALTER TABLE "Task" DROP COLUMN IF EXISTS "zoneId";
DROP TABLE IF EXISTS "SceneZone";
DROP TYPE IF EXISTS "ZoneType";
COMMIT;
