create type "TaskStatus" as enum ('OPEN', 'DONE');

create table if not exists public."Task" (
  id               text          not null primary key,
  title            text          not null,
  description      text,
  "dueDate"        timestamptz,
  status           "TaskStatus"  not null default 'OPEN',
  "organisationId" text          not null references public."Organisation"(id) on delete cascade,
  "assigneeId"     text          references public."User"(id) on delete set null,
  "createdById"    text          not null references public."User"(id),
  "createdAt"      timestamptz   not null default now(),
  "updatedAt"      timestamptz   not null default now()
);

create index if not exists "Task_organisationId_idx" on public."Task" ("organisationId");
create index if not exists "Task_assigneeId_idx" on public."Task" ("assigneeId");
