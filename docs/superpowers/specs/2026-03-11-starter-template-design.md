# Starter Template Design

**Date:** 2026-03-11
**Status:** Approved

## Overview

Scaffold a Next.js 15 starter template using `create-next-app` as a base, then layer in shadcn/ui, Supabase, Prisma, and auth manually. The result is a reusable, auditable template for all future Trustdesign web projects.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres) |
| ORM | Prisma |
| Auth | Supabase Auth |
| State (client) | Zustand |
| State (server) | TanStack Query (installed and configured; usage per project) |
| Testing | Vitest + Playwright + React Testing Library |
| Deployment | Vercel |

## Routes & App Structure

```
src/app/
├── (auth)/
│   ├── layout.tsx              # centered card layout, no sidebar
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── (app)/
│   ├── layout.tsx              # sidebar shell layout
│   ├── dashboard/page.tsx
│   └── settings/page.tsx
├── auth/
│   └── callback/route.ts       # OAuth code exchange → session → redirect to /dashboard
├── layout.tsx                  # root layout — fonts, global providers
└── page.tsx                    # public landing page; redirects authed users to /dashboard
```

**Middleware** (`middleware.ts` at project root):
- Protects all routes under `(app)/` — unauthenticated requests redirect to `/sign-in`
- Authenticated users hitting `/sign-in` or `/sign-up` redirect to `/dashboard`

## Data Model

```prisma
model User {
  id                    String    @id          // Supabase auth UUID — not cuid()
  email                 String    @unique
  name                  String?
  avatarUrl             String?
  role                  Role      @default(USER)
  onboardingCompletedAt DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

The `id` field uses the Supabase auth UUID so the Prisma `User` row stays in sync with `auth.users`. A Supabase Postgres trigger automatically creates the `User` row on signup — no manual sync needed.

**Trigger SQL** (applied in the Supabase dashboard → SQL editor, or via a migration):

```sql
-- Function: create a public User row when a new auth.users row is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public."User" (id, email, "createdAt", "updatedAt")
  values (
    new.id,
    new.email,
    now(),
    now()
  );
  return new;
end;
$$;

-- Trigger: fire after each INSERT on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

The trigger runs with `security definer` so it has permission to write to the public schema. If the insert fails (e.g. duplicate email), the signup transaction rolls back and Supabase returns an error to the client.

## Auth

**Methods:** Email/password and Google OAuth, both via Supabase Auth.

**Supabase clients** (`@supabase/ssr`):
- `src/lib/supabase/server.ts` — server client for Server Components, Server Actions, middleware
- `src/lib/supabase/client.ts` — browser client for Client Components

**Server Actions** (`src/lib/actions/auth.ts`):
- `signInWithEmail(formData)` — validates with Zod, calls Supabase, returns result object
- `signUpWithEmail(formData)` — validates with Zod, creates account, returns result object
- `signInWithGoogle()` — calls `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })`, returns the redirect URL
- `signOut()` — clears session, redirects to `/sign-in`

**OAuth callback** (`src/app/auth/callback/route.ts`):
- Receives the `code` query param from Supabase after Google OAuth
- Calls `supabase.auth.exchangeCodeForSession(code)`
- Redirects to `/dashboard` on success, `/sign-in?error=oauth` on failure

**Session flow:**
1. Supabase issues a JWT cookie on sign-in
2. Middleware validates the session on every `(app)/` request
3. Server Components read the user via `createServerClient`
4. An `<AuthProvider>` Client Component in `(app)/layout.tsx` calls `supabase.auth.getSession()` on mount and populates `useAuthStore`

## Sidebar & Layout

**`(app)/layout.tsx`** — Server Component. Fetches current user via `createServerClient`, passes to `<AuthProvider>` and sidebar. Renders sidebar + `{children}` in a flex layout.

**`src/components/auth-provider.tsx`** — Client Component. Receives the initial `user` prop from the Server Component layout, calls `useAuthStore.setUser(user)` on mount, and subscribes to `supabase.auth.onAuthStateChange` to keep the store in sync.

**`src/components/sidebar.tsx`** — Client Component. Contains:
- App logo/name at top
- Nav links: Dashboard (`/dashboard`), Settings (`/settings`)
- `{/* Add nav items here */}` comment as the extension point
- User avatar + name at bottom with sign-out button
- Collapses to a shadcn/ui Sheet (drawer) on mobile

**`src/components/user-menu.tsx`** — isolated Client Component for the bottom user section.

**`src/hooks/use-current-user.ts`** — reads from `useAuthStore`. Avoids prop drilling in Client Components.

**`src/stores/auth-store.ts`** — Zustand store: `{ user: User | null, isLoading: boolean, setUser }`. The `User` type here is the **Prisma `User`** model (not the Supabase auth user), so the store always holds the full application user including `name`, `avatarUrl`, `role`, etc. The `AuthProvider` receives the Prisma user as an initial prop from the Server Component layout and re-fetches it from the DB when `onAuthStateChange` fires a new session.

## Key Files

```
src/
├── app/
│   ├── (auth)/layout.tsx
│   ├── (auth)/sign-in/page.tsx
│   ├── (auth)/sign-up/page.tsx
│   ├── (app)/layout.tsx
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/settings/page.tsx
│   ├── auth/callback/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── auth-provider.tsx
│   ├── sidebar.tsx
│   └── user-menu.tsx
├── hooks/
│   └── use-current-user.ts
├── lib/
│   ├── prisma.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── actions/
│       └── auth.ts
├── stores/
│   └── auth-store.ts
└── types/
    └── index.ts
middleware.ts
prisma/
└── schema.prisma
.env.example
supabase/
└── migrations/
    └── 00_handle_new_user.sql    # trigger SQL (can be applied manually or via CLI)
```

## Environment Variables

```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Error Handling

- Server actions return `{ success: true, data }` or `{ success: false, error: string }` — never throw to the client
- Auth pages use `useActionState` (React 19 / Next.js 15 API) to display server action errors inline
- Root layout includes an error boundary for unexpected client errors

## Security

- Middleware validates session on every protected request
- Supabase RLS policies as defence-in-depth (to be configured per project)
- All server actions validate auth before any DB operation
- Input validated with Zod on all form submissions
- No secrets exposed via `NEXT_PUBLIC_` prefix

## Testing

- Vitest for unit tests (co-located with source files)
- React Testing Library for component tests
- Playwright for E2E (in `/tests/e2e/`)
- Starter includes one smoke E2E test: sign up → redirect to dashboard

## Out of Scope

- Email verification UI (Supabase handles this via email)
- Password reset flow (can be added per project)
- Onboarding wizard (schema field is included; UI is out of scope for the template)
- Multi-tenancy / organisations
- TanStack Query usage patterns (installed and configured; concrete usage is per-project)
