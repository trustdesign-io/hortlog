-- CreateTable
CREATE TABLE "WorkLogEntryCoworker" (
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLogEntryCoworker_pkey" PRIMARY KEY ("entryId","userId")
);

-- CreateIndex
CREATE INDEX "WorkLogEntryCoworker_userId_idx" ON "WorkLogEntryCoworker"("userId");

-- AddForeignKey
ALTER TABLE "WorkLogEntryCoworker" ADD CONSTRAINT "WorkLogEntryCoworker_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "WorkLogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogEntryCoworker" ADD CONSTRAINT "WorkLogEntryCoworker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

