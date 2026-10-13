-- Organisation-defined collection types (e.g. Location, Taxonomy); one per collection.
BEGIN;
CREATE TABLE IF NOT EXISTS "CollectionType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organisationId" TEXT NOT NULL,
    CONSTRAINT "CollectionType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CollectionType_organisationId_name_key" ON "CollectionType"("organisationId", "name");
ALTER TABLE "CollectionType" ADD CONSTRAINT "CollectionType_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "typeId" TEXT;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CollectionType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;
