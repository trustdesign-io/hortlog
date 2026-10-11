-- Director: same permissions as Manager, its own title. Additive only.
alter type public."MembershipRole" add value if not exists 'DIRECTOR' before 'MANAGER';
alter table public."Organisation" add column if not exists "directorLabel" text not null default 'Director';
