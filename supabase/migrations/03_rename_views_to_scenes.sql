-- Views are now called Scenes, in the app and in the database.
-- Renames only: no data is changed. Constraint and index names follow Prisma's defaults.
begin;

alter table public."View" rename to "Scene";
alter table public."Scene" rename constraint "View_pkey" to "Scene_pkey";
alter table public."Scene" rename constraint "View_organisationId_fkey" to "Scene_organisationId_fkey";
alter table public."Scene" rename constraint "View_primaryCollectionId_fkey" to "Scene_primaryCollectionId_fkey";
alter index public."View_shortCode_key" rename to "Scene_shortCode_key";
alter index public."View_slug_organisationId_key" rename to "Scene_slug_organisationId_key";

alter table public."ViewAssignment" rename to "SceneAssignment";
alter table public."SceneAssignment" rename column "viewId" to "sceneId";
alter table public."SceneAssignment" rename constraint "ViewAssignment_pkey" to "SceneAssignment_pkey";
alter table public."SceneAssignment" rename constraint "ViewAssignment_viewId_fkey" to "SceneAssignment_sceneId_fkey";
alter table public."SceneAssignment" rename constraint "ViewAssignment_userId_fkey" to "SceneAssignment_userId_fkey";
alter table public."SceneAssignment" rename constraint "ViewAssignment_assignedById_fkey" to "SceneAssignment_assignedById_fkey";
alter index public."ViewAssignment_viewId_userId_key" rename to "SceneAssignment_sceneId_userId_key";

alter table public."Specimen" rename column "viewId" to "sceneId";
alter table public."Specimen" rename constraint "Specimen_viewId_fkey" to "Specimen_sceneId_fkey";

commit;
