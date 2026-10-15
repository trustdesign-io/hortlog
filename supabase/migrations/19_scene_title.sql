-- Optional on-screen title for a scene; the printed label keeps the fixed name.
ALTER TABLE "Scene" ADD COLUMN IF NOT EXISTS "title" TEXT;
