-- Public records: per-user opt-in at /u/{username}, per-organisation permission. Additive only.
alter table public."User"
  add column if not exists "recordPublic" boolean not null default false,
  add column if not exists "recordShowNotes" boolean not null default false,
  add column if not exists "username" text;
create unique index if not exists "User_username_key" on public."User"("username");
alter table public."Organisation"
  add column if not exists "recordsPublic" boolean not null default true,
  add column if not exists "privateRecordsShowName" boolean not null default true;
