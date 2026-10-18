## First-time setup

Before doing anything else in a new environment, read docs/SETUP.md in full.
It contains all required steps for environment variables, database migrations,
Google OAuth, and first login behaviour. Do not skip it.

# [Project Name]

> Replace everything in square brackets before using this template.

## Project Overview
[One paragraph: what this project does, who it's for, core value proposition.]

## Tech Stack
| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres) |
| ORM | Prisma |
| Auth | Supabase Auth |
| State (client) | Zustand |
| State (server) | TanStack Query |
| Testing | Vitest + Playwright + React Testing Library |
| Deployment | Vercel |

> For React Native projects: replace Framework with Expo + React Native, Deployment with EAS Build.

## Directory Structure
```
src/
├── app/              # Next.js App Router — pages, layouts, API routes
├── components/       # Shared reusable components
│   └── ui/           # shadcn/ui base components (do not edit directly)
├── lib/              # Utilities, helpers, config, Prisma client
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
└── types/            # TypeScript type definitions
prisma/
├── schema.prisma     # Database schema
└── migrations/       # Auto-generated migration files
```

## Coding Conventions
- **Components:** Functional components with TypeScript. Named exports only (no default exports except for page.tsx files required by Next.js).
- **Server vs Client:** Default to React Server Components. Add `'use client'` only when required (event handlers, browser APIs, hooks).
- **Types:** No `any`. Every function parameter and return value should be typed. Use `interface` for object shapes, `type` for unions/intersections.
- **Imports:** Group in order: external packages → internal paths → types → styles. Use `@/` alias for `src/`.
- **Error handling:** Server actions use try/catch. Components use error boundaries. Always show user-friendly messages.
- **Accessibility:** Semantic HTML, keyboard navigation, WCAG AA colour contrast, meaningful alt text on all images.
- **Unavailable actions are greyed out, never hidden:** if a user can't take an action right now (their role, their own account, waiting to sync, offline…), still show the control, disabled, with its reason. Use `UnavailableAction` (`src/components/ui/unavailable-action.tsx`), or `ActionLink` for links: tapping shows why, since phones have no hover. Hide only whole pages or sections a role should never see.

## Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `user-profile.tsx` |
| React components | PascalCase | `UserProfile` |
| Hooks | camelCase + "use" prefix | `useCurrentUser` |
| Utilities | camelCase | `formatCurrency` |
| Types / Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Zustand stores | camelCase + "Store" | `useAuthStore` |
| Prisma models | PascalCase singular | `User`, `Post` |
| Database tables | snake_case plural | `users`, `blog_posts` |
| API routes | kebab-case | `/api/user-profile` |

## Git Conventions
- **Branches:** `feature/short-description`, `fix/short-description`, `chore/short-description`
- **Commits:** Conventional commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- **PRs:** Always open a PR. Never push directly to `main`. PRs must pass CI.
- **Reviews:** Tag `@claude` in PR comments for AI-assisted review.

## Running the Project
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # ESLint check
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Run pending migrations
```

Database changes ship as Prisma migrations in `prisma/migrations/`. The production build on Vercel applies them before building (`scripts/migrate-on-deploy.mjs`), so new code never goes live ahead of its tables; a failed migration fails the build and the current version stays live. Preview builds never touch the database. CI's `Run DB migrations` job also runs `migrate deploy` on merge (a no-op if the build got there first). `0_init` is the database as it was when migrations began; it's recorded as applied, never run. Keep migrations additive where possible (add before removing), since the old version keeps serving until the new build finishes.

## Environment Variables
Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`.
See `docs/SETUP.md` for the full list, format, and where to find each value.

## Key Contacts & Links
| Resource | Link |
|----------|------|
| Vercel dashboard | [link] |
| Supabase dashboard | [link] |
| Figma designs | [link] |
| GitHub repo | [link] |
| Linear / project board | [link] |
