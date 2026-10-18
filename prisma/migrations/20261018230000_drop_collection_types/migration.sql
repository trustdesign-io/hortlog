-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_typeId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionType" DROP CONSTRAINT "CollectionType_organisationId_fkey";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "typeId";

-- DropTable
DROP TABLE "CollectionType";

