create table if not exists public."ViewAssignment" (
  id             text        not null primary key,
  "viewId"       text        not null references public."View"(id) on delete cascade,
  "userId"       text        not null references public."User"(id) on delete cascade,
  "assignedById" text        not null references public."User"(id),
  "assignedAt"   timestamptz not null default now(),
  unique("viewId", "userId")
);
