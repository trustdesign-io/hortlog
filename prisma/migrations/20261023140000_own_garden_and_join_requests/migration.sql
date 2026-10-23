-- A garden made for one person who signed up without one
ALTER TABLE "Organisation" ADD COLUMN "personal" BOOLEAN NOT NULL DEFAULT false;

-- Asking to join a garden
CREATE TABLE "JoinRequest" (
    "id" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declinedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,

    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JoinRequest_userId_organisationId_key" ON "JoinRequest"("userId", "organisationId");
CREATE INDEX "JoinRequest_organisationId_idx" ON "JoinRequest"("organisationId");

ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
