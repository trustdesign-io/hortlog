-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('DIRECTOR', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "ScenePerspective" AS ENUM ('BED', 'WALL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE');

-- CreateEnum
CREATE TYPE "WorkAction" AS ENUM ('PLANTED', 'POTTED_ON', 'REPOTTED', 'PRUNED', 'WATERED', 'FED', 'PROPAGATED', 'DIVIDED', 'STAKED', 'WEEDED', 'MULCHED', 'PEST_DISEASE_TREATMENT', 'LABELLED', 'SURVEYED', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" TIMESTAMP(3),
    "username" TEXT,
    "recordPublic" BOOLEAN NOT NULL DEFAULT false,
    "recordShowNotes" BOOLEAN NOT NULL DEFAULT false,
    "creditOnPlants" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "directorLabel" TEXT NOT NULL DEFAULT 'Director',
    "managerLabel" TEXT NOT NULL DEFAULT 'Manager',
    "memberLabel" TEXT NOT NULL DEFAULT 'Member',
    "postcode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "recordsPublic" BOOLEAN NOT NULL DEFAULT true,
    "privateRecordsShowName" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "family" TEXT,
    "origin" TEXT,
    "description" TEXT,
    "conservationStatus" TEXT,
    "powoUrl" TEXT,
    "colId" TEXT,
    "ipniId" TEXT,
    "nameKey" TEXT,
    "authority" TEXT,
    "photoUrl" TEXT,
    "photoAttribution" TEXT,
    "photoLicence" TEXT,
    "photoSourceUrl" TEXT,
    "inatTaxonId" INTEGER,
    "ellenbergL" INTEGER,
    "ellenbergF" INTEGER,
    "ellenbergR" INTEGER,
    "ellenbergN" INTEGER,
    "ellenbergS" INTEGER,
    "ellenbergSource" TEXT,
    "statusCategory" TEXT,
    "statusSource" TEXT,
    "statusUpdatedAt" TIMESTAMP(3),
    "nativeRegions" TEXT[],
    "introducedRegions" TEXT[],
    "lifeForm" TEXT,
    "climate" TEXT,
    "habitatExcerpt" TEXT,
    "habitatExcerptSource" TEXT,
    "gbifTaxonKey" INTEGER,
    "openDataUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "typeId" TEXT,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organisationId" TEXT NOT NULL,

    CONSTRAINT "CollectionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "perspective" "ScenePerspective" NOT NULL DEFAULT 'BED',
    "gridRows" INTEGER NOT NULL DEFAULT 4,
    "gridCols" INTEGER NOT NULL DEFAULT 4,
    "rowShift" INTEGER NOT NULL DEFAULT 0,
    "splitCells" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blockedCells" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoTakenAt" TIMESTAMP(3),
    "photoMappedAt" TIMESTAMP(3),
    "shortCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "primaryCollectionId" TEXT,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneAssignment" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sceneId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,

    CONSTRAINT "SceneAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "specimenId" TEXT,
    "sceneId" TEXT,
    "cells" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careSpecimenIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careAction" "WorkAction",
    "createdById" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specimen" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cultivar" TEXT,
    "accessionNumber" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "gridCell" TEXT,
    "extraCells" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoX" DOUBLE PRECISION,
    "photoY" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organisationId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "sceneId" TEXT,

    CONSTRAINT "Specimen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionMembership" (
    "specimenId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "CollectionMembership_pkey" PRIMARY KEY ("specimenId","collectionId")
);

-- CreateTable
CREATE TABLE "WorkRecord" (
    "id" TEXT NOT NULL,
    "recordNumber" INTEGER NOT NULL,
    "firstWorkedDate" TIMESTAMP(3) NOT NULL,
    "scientificName" TEXT NOT NULL,
    "family" TEXT,
    "nameHtml" TEXT,
    "authority" TEXT,
    "commonNames" TEXT,
    "nativeRange" TEXT,
    "habit" TEXT,
    "diagnostic" TEXT,
    "nearMisses" TEXT,
    "powoUrl" TEXT,
    "site" TEXT,
    "location" TEXT,
    "viceCounty" TEXT,
    "gridRef" TEXT,
    "projects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "howStudied" TEXT,
    "determination" TEXT,
    "labelText" TEXT,
    "provenance" TEXT,
    "workDone" TEXT,
    "observed" TEXT,
    "note" TEXT,
    "sources" TEXT,
    "openQuestions" TEXT,
    "shareToken" TEXT,
    "userId" TEXT NOT NULL,
    "specimenId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLogEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "action" "WorkAction" NOT NULL,
    "actionNote" TEXT,
    "location" TEXT,
    "text" TEXT,
    "workRecordId" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkRecordEdit" (
    "id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedById" TEXT,
    "workRecordId" TEXT NOT NULL,

    CONSTRAINT "WorkRecordEdit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLogEntryEdit" (
    "id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedById" TEXT,
    "workLogEntryId" TEXT NOT NULL,

    CONSTRAINT "WorkLogEntryEdit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncOp" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncOp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organisationId_key" ON "Membership"("userId", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "Species"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Species_colId_key" ON "Species"("colId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_ipniId_key" ON "Species"("ipniId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_nameKey_key" ON "Species"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_organisationId_key" ON "Collection"("slug", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionType_organisationId_name_key" ON "CollectionType"("organisationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Scene_shortCode_key" ON "Scene"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Scene_slug_organisationId_key" ON "Scene"("slug", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneAssignment_sceneId_userId_key" ON "SceneAssignment"("sceneId", "userId");

-- CreateIndex
CREATE INDEX "Task_organisationId_idx" ON "Task"("organisationId");

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Specimen_slug_organisationId_key" ON "Specimen"("slug", "organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRecord_shareToken_key" ON "WorkRecord"("shareToken");

-- CreateIndex
CREATE INDEX "WorkRecord_specimenId_idx" ON "WorkRecord"("specimenId");

-- CreateIndex
CREATE INDEX "WorkRecord_userId_idx" ON "WorkRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRecord_userId_specimenId_key" ON "WorkRecord"("userId", "specimenId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRecord_userId_recordNumber_key" ON "WorkRecord"("userId", "recordNumber");

-- CreateIndex
CREATE INDEX "WorkLogEntry_workRecordId_date_idx" ON "WorkLogEntry"("workRecordId", "date");

-- CreateIndex
CREATE INDEX "WorkLogEntry_date_idx" ON "WorkLogEntry"("date");

-- CreateIndex
CREATE INDEX "WorkLogEntry_taskId_idx" ON "WorkLogEntry"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_hash_key" ON "ApiKey"("hash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "SyncOp_userId_idx" ON "SyncOp"("userId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CollectionType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionType" ADD CONSTRAINT "CollectionType_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_primaryCollectionId_fkey" FOREIGN KEY ("primaryCollectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneAssignment" ADD CONSTRAINT "SceneAssignment_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneAssignment" ADD CONSTRAINT "SceneAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneAssignment" ADD CONSTRAINT "SceneAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_specimenId_fkey" FOREIGN KEY ("specimenId") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specimen" ADD CONSTRAINT "Specimen_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specimen" ADD CONSTRAINT "Specimen_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specimen" ADD CONSTRAINT "Specimen_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMembership" ADD CONSTRAINT "CollectionMembership_specimenId_fkey" FOREIGN KEY ("specimenId") REFERENCES "Specimen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMembership" ADD CONSTRAINT "CollectionMembership_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_specimenId_fkey" FOREIGN KEY ("specimenId") REFERENCES "Specimen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecord" ADD CONSTRAINT "WorkRecord_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogEntry" ADD CONSTRAINT "WorkLogEntry_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "WorkRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogEntry" ADD CONSTRAINT "WorkLogEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecordEdit" ADD CONSTRAINT "WorkRecordEdit_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRecordEdit" ADD CONSTRAINT "WorkRecordEdit_workRecordId_fkey" FOREIGN KEY ("workRecordId") REFERENCES "WorkRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogEntryEdit" ADD CONSTRAINT "WorkLogEntryEdit_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogEntryEdit" ADD CONSTRAINT "WorkLogEntryEdit_workLogEntryId_fkey" FOREIGN KEY ("workLogEntryId") REFERENCES "WorkLogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

