# starter-web

A Next.js 15 starter template with Supabase auth, Prisma ORM, Tailwind CSS, and shadcn/ui — ready to fork and customise for new projects.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres) |
| ORM | Prisma |
| Auth | Supabase Auth (Google OAuth) |
| State (client) | Zustand |
| State (server) | TanStack Query |
| Testing | Vitest + Playwright + React Testing Library |
| Deployment | Vercel |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`. See `docs/SETUP.md` for full instructions on Supabase, Google OAuth, and first-login behaviour.

### 3. Push the schema and generate the Prisma client

For initial setup, push the schema directly (no migration file generated):

```bash
npx prisma db push
npx prisma generate
```

For subsequent schema changes, use `npx prisma migrate dev` to create a migration file.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint check
npm run type-check   # TypeScript type check
npx prisma studio    # Browse the database
npx prisma migrate dev  # Run pending migrations
npx prisma generate  # Regenerate Prisma client after schema changes
```

## Project Structure

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

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values. See `docs/SETUP.md` for the full list and where to find each value.

## Documentation

- `docs/SETUP.md` — full environment setup guide
- `CLAUDE.md` — conventions and AI coding instructions
