-- AlterTable
ALTER TABLE "Species" ADD COLUMN "wcvpStatus" TEXT,
ADD COLUMN "wcvpAcceptedName" TEXT,
ADD COLUMN "wcvpAcceptedAuthority" TEXT,
ADD COLUMN "wcvpAcceptedIpniId" TEXT,
ADD COLUMN "wcvpPowoUrl" TEXT,
ADD COLUMN "wcvpCheckedAt" TIMESTAMP(3);
