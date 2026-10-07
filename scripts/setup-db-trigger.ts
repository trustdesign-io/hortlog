/**
 * Applies the handle_new_user trigger to the Supabase database and
 * backfills any auth.users rows that don't yet have a matching User row.
 *
 * Run once after initial database setup, and whenever deploying to a new
 * Supabase project (e.g. preview environments).
 *
 * Usage: npm run setup:trigger
 *
 * Requires DIRECT_URL in environment (the non-pooled connection string).
 * DIRECT_URL has the permissions needed to touch the auth schema.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Use DIRECT_URL for auth-schema access (non-pooled connection required)
process.env.DATABASE_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL
const prisma = new PrismaClient()

async function main() {
  console.log('Applying handle_new_user trigger...')

  await prisma.$executeRaw`
    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer set search_path = ''
    as $$
    begin
      insert into public."User" (id, email, name, "createdAt", "updatedAt")
      values (
        new.id,
        new.email,
        coalesce(
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'full_name'
        ),
        now(),
        now()
      )
      on conflict (id) do nothing;
      return new;
    end;
    $$
  `

  await prisma.$executeRaw`
    create or replace trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user()
  `

  console.log('Trigger applied.')

  console.log('Backfilling existing auth.users without a User row...')

  const result = await prisma.$executeRaw`
    insert into public."User" (id, email, name, "createdAt", "updatedAt")
    select
      au.id,
      au.email,
      coalesce(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name'
      ),
      coalesce(au.created_at, now()),
      now()
    from auth.users au
    where not exists (
      select 1 from public."User" u where u.id = au.id
    )
  `

  console.log(`Backfilled ${result} user(s).`)

  console.log('Verifying trigger is installed...')

  const rows = await prisma.$queryRaw<Array<{ tgname: string }>>`
    select tgname
    from pg_trigger
    where tgname = 'on_auth_user_created'
  `

  if (rows.length === 0) {
    throw new Error('Trigger verification failed: on_auth_user_created not found in pg_trigger')
  }

  console.log('Trigger verified: on_auth_user_created is installed.')
}

main()
  .catch(err => {
    console.error('setup-db-trigger failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
