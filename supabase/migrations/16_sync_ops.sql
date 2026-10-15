-- Changes made offline and sent later; the device's id makes a resend a no-op.
CREATE TABLE IF NOT EXISTS "SyncOp" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncOp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SyncOp_userId_idx" ON "SyncOp"("userId");
-- Only the server (Prisma, as the table owner) touches this table
ALTER TABLE "SyncOp" ENABLE ROW LEVEL SECURITY;
