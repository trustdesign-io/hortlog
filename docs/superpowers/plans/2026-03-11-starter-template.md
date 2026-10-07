# Starter Template Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-ready Next.js 15 starter template with Supabase auth (email/password + Google OAuth), Prisma ORM, shadcn/ui, a protected sidebar shell layout, and dashboard + settings pages.

**Architecture:** `create-next-app` provides the baseline; all extra dependencies are layered in explicitly so every addition is auditable. Route groups `(auth)/` and `(app)/` separate unauthenticated and authenticated areas. Middleware enforces session protection on every request. An `AuthProvider` Client Component hydrates a Zustand store with the Prisma `User` on mount and listens for sign-out via `onAuthStateChange`.

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS, shadcn/ui, Supabase Auth + Postgres, `@supabase/ssr`, Prisma, Zustand, TanStack Query (installed, usage per-project), Zod, Vitest + React Testing Library, Playwright

---

## File Map

| File | Responsibility |
|------|----------------|
| `middleware.ts` | Session guard: protects `(app)/` routes, redirects authed users from auth pages |
| `src/app/layout.tsx` | Root layout — fonts, `<html>`, global CSS |
| `src/app/page.tsx` | Landing: redirect authed → `/dashboard`, else → `/sign-in` |
| `src/app/(auth)/layout.tsx` | Centered card container for auth pages |
| `src/app/(auth)/sign-in/page.tsx` | Email/password sign-in form + Google OAuth button |
| `src/app/(auth)/sign-up/page.tsx` | Email/password sign-up form + Google OAuth button |
| `src/app/(app)/layout.tsx` | Fetches Prisma user, renders `<AuthProvider>` + `<Sidebar>` shell |
| `src/app/(app)/dashboard/page.tsx` | Dashboard placeholder page |
| `src/app/(app)/settings/page.tsx` | Settings placeholder page |
| `src/app/auth/callback/route.ts` | OAuth code exchange → session → redirect to `/dashboard` |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/supabase/server.ts` | Supabase server client (Server Components, Actions, middleware) |
| `src/lib/supabase/client.ts` | Supabase browser client (Client Components) |
| `src/lib/actions/auth.ts` | Server actions: signInWithEmail, signUpWithEmail, signOut |
| `src/stores/auth-store.ts` | Zustand store: `{ user, isLoading, setUser }` |
| `src/hooks/use-current-user.ts` | Reads current user from auth store |
| `src/components/auth-provider.tsx` | Hydrates auth store; listens for auth state changes |
| `src/components/sidebar.tsx` | Sidebar nav + mobile sheet drawer |
| `src/components/user-menu.tsx` | User avatar, name, sign-out button |
| `src/types/index.ts` | Re-exports Prisma types; defines `ActionResult<T>` |
| `prisma/schema.prisma` | `User` model + `Role` enum |
| `supabase/migrations/00_handle_new_user.sql` | Postgres trigger: creates `User` row on signup |
| `.env.example` | Environment variable template |
| `vitest.config.ts` | Vitest config |
| `vitest.setup.ts` | `@testing-library/jest-dom` import |
| `playwright.config.ts` | Playwright config |
| `tests/e2e/auth.spec.ts` | Smoke E2E: pages load, middleware redirects |
| `src/stores/auth-store.test.ts` | Unit tests for auth store |

---

## Chunk 1: Project Bootstrap

### Task 1: Scaffold with create-next-app and install dependencies

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `src/app/globals.css` (all generated)
- Create: `.env.example`

- [ ] **Step 1: Run create-next-app in the current directory**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

When prompted "Would you like to proceed?" (because the directory is not empty), answer **Yes**.

Expected: Dependencies installed, `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` all created.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js @prisma/client zod zustand @tanstack/react-query lucide-react
npm install --save-dev prisma vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

- [ ] **Step 3: Verify tsconfig strict mode**

Open `tsconfig.json`. Confirm `"strict": true` is present under `compilerOptions`. `create-next-app` sets this by default — no change needed. If it's missing, add it.

- [ ] **Step 4: Create .env.example**

Create `/.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 5: Copy .env.example to .env.local**

```bash
cp .env.example .env.local
```

Fill in real values from your Supabase project dashboard before running the dev server.

- [ ] **Step 6: Verify .env.local is gitignored**

```bash
git check-ignore -v .env.local
```

Expected: output shows `.env.local` is covered by `.gitignore`. If it is not listed, add `.env.local` to `.gitignore` before continuing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js 15 app with dependencies"
```

---

### Task 2: Configure shadcn/ui

**Files:**
- Modify: `src/app/globals.css`, `tailwind.config.ts` (by shadcn CLI)
- Modify: `next.config.ts` (if needed for aliases)
- Create: `src/lib/utils.ts`, `components.json`

- [ ] **Step 1: Initialise shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base colour: **Slate** (or your preference — this is the template default)
- CSS variables: **Yes**

- [ ] **Step 2: Add required components**

```bash
npx shadcn@latest add button input label card sheet avatar form
```

Expected: Component files created under `src/components/ui/`.

- [ ] **Step 3: Verify `src/lib/utils.ts` exists**

It should contain:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

If shadcn created it, leave it as-is.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui and base components"
```

---

### Task 3: Configure Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `supabase/migrations/00_handle_new_user.sql`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Initialise Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: `prisma/schema.prisma` and `.env` created. Delete the generated `.env` — we use `.env.local`.

```bash
rm .env
```

- [ ] **Step 2: Write the Prisma schema**

Replace the contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id                    String    @id
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

Note: `id` is a plain `String` with no default — it receives the Supabase auth UUID via the Postgres trigger.

- [ ] **Step 3: Create the Supabase trigger migration**

Create `supabase/migrations/00_handle_new_user.sql`:

```sql
-- Creates a public."User" row whenever a new auth.users row is inserted.
-- Apply this in the Supabase dashboard SQL editor or via `supabase db push`.

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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Apply this SQL** in the Supabase dashboard → SQL editor before running any auth flows.

- [ ] **Step 4: Write the Prisma client singleton**

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Generate the Prisma client**

```bash
npx prisma generate
```

Expected: `@prisma/client` types generated. No migration is run yet — the schema is applied via Supabase's own Postgres.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Prisma schema and Supabase trigger migration"
```

---

## Chunk 2: Auth Infrastructure

### Task 4: Supabase client libraries

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`

- [ ] **Step 1: Create the server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — middleware handles session refresh
          }
        },
      },
    }
  )
}
```

- [ ] **Step 2: Create the browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase server and browser clients"
```

---

### Task 5: TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write shared types**

Create `src/types/index.ts`:

```ts
import type { User, Role } from '@prisma/client'

export type { User, Role }

export interface ActionResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: add shared TypeScript types"
```

---

### Task 6: Middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write the middleware**

Create `middleware.ts` at the project root:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not add any logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  // Add new (app)/ route prefixes here when you add pages to the (app) route group
  const protectedPaths = ['/dashboard', '/settings']
  const isAppRoute = protectedPaths.some((p) => pathname.startsWith(p))
  const isAuthRoute = pathname === '/sign-in' || pathname === '/sign-up'

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add session middleware for protected routes"
```

---

## Chunk 3: Auth Logic & State

### Task 7: Auth server actions + OAuth callback route

**Files:**
- Create: `src/lib/actions/auth.ts`
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Write auth server actions**

Create `src/lib/actions/auth.ts`:

```ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
})

const SignUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export async function signInWithEmail(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const result = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { success: false, error: result.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return { success: false, error: 'Invalid email or password.' }
  }

  redirect('/dashboard')
}

export async function signUpWithEmail(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const result = SignUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return { success: false, error: result.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { name: result.data.name },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
```

- [ ] **Step 2: Write the OAuth callback route**

Create `src/app/auth/callback/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=oauth`)
}
```

**Note on Google OAuth:** `signInWithOAuth` is intentionally called directly from the browser via the Supabase browser client in each auth page component — not as a server action. This is because `signInWithOAuth` returns a redirect URL that the browser must navigate to, which cannot be done from a server action context. The `handleGoogleSignIn` function in the sign-in and sign-up pages (Task 11) handles this directly.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/auth.ts src/app/auth/
git commit -m "feat: add auth server actions and OAuth callback route"
```

---

### Task 8: Auth store and hook (TDD)

**Files:**
- Create: `src/stores/auth-store.ts`
- Create: `src/stores/auth-store.test.ts`
- Create: `src/hooks/use-current-user.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add test script to `package.json` (under `"scripts"`):

```json
"test": "vitest"
```

- [ ] **Step 2: Write the failing unit test first**

Create `src/stores/auth-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth-store'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true })
  })

  it('initialises with null user and isLoading true', () => {
    const { user, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isLoading).toBe(true)
  })

  it('setUser updates user and sets isLoading false', () => {
    const mockUser = { id: 'abc', email: 'test@example.com' } as unknown as import('@/types').User

    useAuthStore.getState().setUser(mockUser)

    const { user, isLoading } = useAuthStore.getState()
    expect(user).toEqual(mockUser)
    expect(isLoading).toBe(false)
  })

  it('setUser with null clears the user', () => {
    const mockUser = { id: 'abc', email: 'test@example.com' } as unknown as import('@/types').User
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
```

- [ ] **Step 3: Run the test — expect it to fail**

```bash
npm test -- src/stores/auth-store.test.ts
```

Expected: FAIL — "Cannot find module './auth-store'"

- [ ] **Step 4: Write the auth store**

Create `src/stores/auth-store.ts`:

```ts
import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
}))
```

- [ ] **Step 5: Run the test — expect it to pass**

```bash
npm test -- src/stores/auth-store.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 6: Write the hook**

Create `src/hooks/use-current-user.ts`:

```ts
import { useAuthStore } from '@/stores/auth-store'

export function useCurrentUser() {
  return useAuthStore((state) => state.user)
}
```

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts vitest.setup.ts src/stores/ src/hooks/
git commit -m "feat: add auth store, useCurrentUser hook, and unit tests"
```

---

### Task 9: AuthProvider component

**Files:**
- Create: `src/components/auth-provider.tsx`

- [ ] **Step 1: Write AuthProvider**

**Design note on `onAuthStateChange`:** This component only clears the store on sign-out. It does not re-fetch the Prisma user on `SIGNED_IN` events because it is not needed: when a user signs in, the auth server action calls `redirect('/dashboard')`, which causes a full server-side navigation. The `(app)/layout.tsx` Server Component re-runs on every navigation and always fetches fresh user data from the database, passing it as `initialUser` on the next render. There is no client-state gap to fill.

Create `src/components/auth-provider.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/types'

interface AuthProviderProps {
  initialUser: User | null
  children: React.ReactNode
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setUser(initialUser)

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Clear the store on sign-out. New sign-ins always trigger a full
      // server navigation, so initialUser is refreshed from the server layout.
      if (!session) {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [initialUser, setUser])

  return <>{children}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth-provider.tsx
git commit -m "feat: add AuthProvider to hydrate auth store"
```

---

## Chunk 4: App Shell & Pages

### Task 10: Root layout and landing page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css` (already modified by shadcn — leave as-is)

- [ ] **Step 1: Rewrite root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'App',
  description: 'Built with the Trustdesign starter',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Rewrite the landing page**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  redirect('/sign-in')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add root layout and landing page redirect"
```

---

### Task 11: Auth pages

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/app/(auth)/sign-up/page.tsx`

**Note on Google OAuth:** The spec initially described `signInWithGoogle()` as a server action. This plan intentionally deviates from that: `supabase.auth.signInWithOAuth` is called directly from the browser client inside `handleGoogleSignIn` in each auth page. This is the correct approach — `signInWithOAuth` returns a URL that the browser must navigate to, which a server action cannot do. No server action for Google OAuth is needed. The sign-in/sign-up pages call the Supabase browser client directly.

- [ ] **Step 1: Auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Sign-in page**

Create `src/app/(auth)/sign-in/page.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { signInWithEmail } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: true }

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, initialState)

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your email and password to continue.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {!state.success && state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 3: Sign-up page**

Create `src/app/(auth)/sign-up/page.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { signUpWithEmail } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: true }

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, initialState)

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your details to get started.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {!state.success && state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: add sign-in and sign-up pages"
```

---

### Task 12: Sidebar, user menu, and app shell

**Files:**
- Create: `src/components/sidebar.tsx`
- Create: `src/components/user-menu.tsx`
- Create: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Write the user menu component**

Create `src/components/user-menu.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import type { User } from '@/types'

interface UserMenuProps {
  user: User
}

function getInitials(user: User): string {
  if (user.name) {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.email.slice(0, 2).toUpperCase()
}

export function UserMenu({ user }: UserMenuProps) {
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={user.avatarUrl ?? undefined}
          alt={user.name ?? user.email}
        />
        <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">
          {user.name ?? 'User'}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isPending}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        Sign out
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Write the sidebar component**

Create `src/components/sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { UserMenu } from '@/components/user-menu'
import type { User } from '@/types'

interface SidebarProps {
  user: User
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
  // Add nav items here
] as const

function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          aria-current={pathname === item.href ? 'page' : undefined}
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

function SidebarContent({ user }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-6">
        <span className="font-semibold">App Name</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks />
      </div>
      <div className="border-t">
        <UserMenu user={user} />
      </div>
    </div>
  )
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent user={user} />
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 3: Write the app shell layout**

Create `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AuthProvider } from '@/components/auth-provider'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } })

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar.tsx src/components/user-menu.tsx src/app/\(app\)/layout.tsx
git commit -m "feat: add sidebar, user menu, and app shell layout"
```

---

### Task 13: Dashboard and settings pages

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Dashboard page**

Create `src/app/(app)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome. Add your content here.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Settings page**

Create `src/app/(app)/settings/page.tsx`:

```tsx
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account settings here.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/dashboard/ src/app/\(app\)/settings/
git commit -m "feat: add dashboard and settings placeholder pages"
```

---

## Chunk 5: Testing

### Task 14: Playwright E2E smoke tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth.spec.ts`

**Prerequisites:** `.env.local` must be filled with real Supabase credentials before running E2E tests.

**Note on authenticated E2E tests:** The smoke tests below cover page rendering and middleware redirects only — they do not perform a real sign-up or sign-in flow. An authenticated E2E test (sign-up → verify redirect to `/dashboard`) requires a dedicated Supabase test project with a known test account. Add this per-project once credentials are configured. The middleware calls `supabase.auth.getUser()` on every request — without valid credentials the app will not start correctly.

- [ ] **Step 1: Add Playwright scripts to package.json**

In `package.json` under `"scripts"`, add:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

Install Playwright browsers:

```bash
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Write the Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 3: Write the smoke E2E tests first (TDD)**

Create `tests/e2e/auth.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Auth smoke tests', () => {
  test('sign-in page renders correctly', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
  })

  test('sign-up page renders correctly', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('sign-in and sign-up pages are linked to each other', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/sign-up')

    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/sign-in')
  })

  test('unauthenticated user visiting /dashboard is redirected to /sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/sign-in')
  })

  test('unauthenticated user visiting /settings is redirected to /sign-in', async ({
    page,
  }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL('/sign-in')
  })
})
```

- [ ] **Step 4: Start the dev server and run E2E tests**

In one terminal:

```bash
npm run dev
```

In another terminal:

```bash
npm run test:e2e
```

Expected: All 5 tests pass. If any fail, fix the issue before continuing.

- [ ] **Step 5: Run unit tests**

```bash
npm test
```

Expected: 3 auth store tests pass.

- [ ] **Step 6: Run the linter**

```bash
npm run lint
```

Fix any ESLint errors before committing.

- [ ] **Step 7: Final commit**

```bash
git add playwright.config.ts tests/ vitest.config.ts vitest.setup.ts
git commit -m "test: add Playwright E2E smoke tests and Vitest config"
```

---

## Post-Setup Checklist

Before using this as a template for a new project, complete the following in the Supabase dashboard:

- [ ] Apply `supabase/migrations/00_handle_new_user.sql` in the SQL editor
- [ ] Enable Google OAuth provider under Authentication → Providers
- [ ] Set the redirect URL to `https://your-domain.com/auth/callback` under Authentication → URL Configuration
- [ ] Enable Row Level Security on the `User` table and add policies as needed
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel environment variables for the production OAuth redirect

## Notes for New Projects

- Replace `"App Name"` in `src/components/sidebar.tsx` with the project name
- Add nav items in the `navItems` array in `sidebar.tsx` at the `// Add nav items here` comment
- Update `metadata` in `src/app/layout.tsx` with the real project title and description
- Add `@tanstack/react-query`'s `QueryClientProvider` to `src/app/layout.tsx` when server state is needed
- The `Role` enum (`USER` / `ADMIN`) is available — add route protection as needed
