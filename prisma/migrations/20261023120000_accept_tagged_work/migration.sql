-- A tagged member can add work someone else logged to their own record; this points at their copy
ALTER TABLE "WorkLogEntryCoworker" ADD COLUMN "acceptedEntryId" TEXT;

ALTER TABLE "WorkLogEntryCoworker" ADD CONSTRAINT "WorkLogEntryCoworker_acceptedEntryId_fkey" FOREIGN KEY ("acceptedEntryId") REFERENCES "WorkLogEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
