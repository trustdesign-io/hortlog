-- CreateTable
CREATE TABLE "SceneNote" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sceneId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "SceneNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SceneNote_sceneId_createdAt_idx" ON "SceneNote"("sceneId", "createdAt");

-- AddForeignKey
ALTER TABLE "SceneNote" ADD CONSTRAINT "SceneNote_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneNote" ADD CONSTRAINT "SceneNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
