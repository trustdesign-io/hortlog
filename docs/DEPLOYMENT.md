# Deployment

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Production | `main` | `https://[project].vercel.app` | Live users |
| Staging | `staging` | `https://[project]-staging.vercel.app` | Pre-release testing |
| Preview | Any PR branch | Auto-generated Vercel URL | PR review |

## Vercel Setup

### First-time setup
```bash
# Install Vercel CLI
npm install -g vercel

# Link project to Vercel (run from project root)
vercel link

# Set production environment variables
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### Auto-deployment
- Merging to `main` → auto-deploys to production
- Opening a PR → creates a preview deployment
- No manual steps required

### Checking a deployment
```bash
vercel ls           # List deployments
vercel logs [url]   # View logs for a deployment
vercel inspect [url] # Inspect a deployment
```

## Database (Supabase)

### Migrations
```bash
# Create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name describe-change

# Deploy migrations to production (runs automatically in CI)
npx prisma migrate deploy

# View database in GUI
npx prisma studio
```

### Production migration flow
1. Create migration locally: `npx prisma migrate dev --name [name]`
2. Commit the migration file
3. GitHub Actions runs `npx prisma migrate deploy` on merge to `main`

### Supabase backups
- Pro plan: automatic daily backups
- Before major migrations: create a manual backup in Supabase dashboard

## CI/CD (GitHub Actions)

See `.github/workflows/ci.yml` for the full pipeline. On every push:

1. `npm ci` — install dependencies
2. `npm run lint` — ESLint
3. `npm run type-check` — TypeScript compiler check
4. `npm run test` — Vitest unit tests
5. `npm run build` — Next.js production build

On merge to `main`:
6. `npx prisma migrate deploy` — run pending DB migrations
7. Vercel auto-deploys (triggered by GitHub push, not this workflow)

## Environment Variables Reference

| Variable | Required | Environments | Notes |
|----------|----------|-------------|-------|
| `DATABASE_URL` | ✅ | All | Supabase pooled connection (for Prisma queries) |
| `DIRECT_URL` | ✅ | All | Supabase direct connection (for migrations only) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | All | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | All | From Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server only | Never expose to client. For admin operations. |
| `NEXTAUTH_URL` | If using NextAuth | All | Full URL of deployment |
| `NEXTAUTH_SECRET` | If using NextAuth | All | `openssl rand -base64 32` |

## Rollback

```bash
# Roll back to a previous Vercel deployment
vercel rollback [deployment-url]

# Roll back a database migration
npx prisma migrate resolve --rolled-back [migration-name]
```

## Monitoring

- **Logs:** Vercel dashboard → Functions tab, or `vercel logs`
- **Errors:** [Add your error tracking service, e.g., Sentry]
- **Uptime:** [Add uptime monitoring if needed]
- **Performance:** Vercel Analytics (built-in), or add Web Vitals tracking
