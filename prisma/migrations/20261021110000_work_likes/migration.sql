-- CreateTable
CREATE TABLE "WorkLogEntryLike" (
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLogEntryLike_pkey" PRIMARY KEY ("entryId","userId")
);

-- CreateIndex
CREATE INDEX "WorkLogEntryLike_userId_idx" ON "WorkLogEntryLike"("userId");

-- AddForeignKey
ALTER TABLE "WorkLogEntryLike" ADD CONSTRAINT "WorkLogEntryLike_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "WorkLogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogEntryLike" ADD CONSTRAINT "WorkLogEntryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
