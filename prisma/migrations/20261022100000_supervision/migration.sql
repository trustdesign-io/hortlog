-- AlterTable
ALTER TABLE "WorkLogEntry" ADD COLUMN "signedOffAt" TIMESTAMP(3),
ADD COLUMN "signOffComment" TEXT,
ADD COLUMN "signedOffById" TEXT;

-- CreateTable
CREATE TABLE "Supervision" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organisationId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,

    CONSTRAINT "Supervision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supervision_supervisorId_idx" ON "Supervision"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "Supervision_organisationId_traineeId_key" ON "Supervision"("organisationId", "traineeId");

-- AddForeignKey
ALTER TABLE "WorkLogEntry" ADD CONSTRAINT "WorkLogEntry_signedOffById_fkey" FOREIGN KEY ("signedOffById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervision" ADD CONSTRAINT "Supervision_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
