# Project Setup Instructions

> These instructions are written for an AI agent (Claude Code) setting up this project
> from scratch. Follow each step in order. Do not skip sections.

---

## 1. Prerequisites

Ensure the following are installed and available in the shell before proceeding:

- **Node.js** (v18+) and **npm**
- **GitHub CLI** (`gh`) — authenticated to the `trustdesign-io` organisation
- **Supabase CLI** — optional, only needed for local Supabase emulation

Required accounts and access:

- **GitHub** — member of the `trustdesign-io` organisation with repo write access
- **Supabase** — project already created, or permission to create one
- **Vercel** — for production deployment (not required for local dev)
- **Google Cloud Console** — to create OAuth 2.0 credentials for Google sign-in

---

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in every value before running any
command. The app will fail to start if any required variable is missing.

```bash
cp .env.example .env.local
```

### Where to find each value

**`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
→ Supabase dashboard → Project → Settings → API → Project URL and anon/public key

**`DATABASE_URL`** and **`DIRECT_URL`**
→ Supabase dashboard → Connect button → ORMs tab → Prisma

The Prisma tab shows both URLs in the correct format. They use the Supabase
**connection pooler** hostname, which is required for Vercel and any IPv4 environment:

```
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

> **Critical — IPv4 compatibility:** Do NOT use the `db.[PROJECT-REF].supabase.co`
> hostname. That direct hostname is IPv6-only and will fail on Vercel (which
> runs on IPv4). Always use the pooler hostname shown in the Supabase dashboard.

> **Critical:** Replace `[PASSWORD]` including the square brackets with the actual
> database password. A literal `[YOUR-PASSWORD]` in the connection string will cause
> authentication failures.

> **Critical — Vercel env vars:** When setting env vars on Vercel via CLI, always
> use `printf '%s' VALUE | vercel env add` — never `echo`. The `echo` command adds
> a trailing newline that corrupts connection strings and causes P1001 errors.

**`SUPABASE_SERVICE_ROLE_KEY`**
→ Supabase dashboard → Project → Settings → API → service_role key (secret — never expose client-side)

### Complete `.env.local` example (with placeholders)

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

---

## 3. Database Setup

### Push the schema

Sync the Prisma schema to the Supabase database. This creates all tables defined in
`prisma/schema.prisma` without generating a migration file (appropriate for initial setup).

```bash
npx prisma db push
```

If this fails with `"The datasource.url property is required"`, the `dotenv/config`
in `prisma.config.ts` is not finding `.env.local`. Pass the variables inline:

```bash
DOTENV_CONFIG_PATH=.env.local npx prisma db push
```

If that also fails with `P1000: Authentication failed`, the connection string credentials
are wrong. Re-read the connection string from the Supabase dashboard (the password may
have been rotated) and update `.env.local`.

### Apply the handle_new_user database trigger

Supabase does not sync Postgres triggers via Prisma. After pushing the schema,
run this script once to install the trigger and backfill any existing auth users:

```bash
npm run setup:trigger
```

This script (`scripts/setup-db-trigger.ts`) does three things:

1. Creates or replaces the `handle_new_user` trigger function in the `public` schema.
   The trigger inserts a `User` row whenever a new row appears in `auth.users`,
   ensuring every Supabase login has a matching application user.
2. Attaches the trigger to `auth.users` as an `AFTER INSERT` trigger.
3. Backfills any `auth.users` rows that do not yet have a `User` row.

> **Required for**: initial setup, new Supabase projects (e.g. preview environments),
> and any environment where users existed in Supabase Auth before the trigger was installed.

> **Requires**: `DIRECT_URL` in `.env.local` — the non-pooled Supabase connection
> string. The pooled `DATABASE_URL` does not have auth-schema access.

The script exits with a non-zero code and prints an error if the trigger is not
installed after the run, so failures are immediately visible.

### Generate the Prisma client

```bash
npx prisma generate
```

This must be run after every change to `prisma/schema.prisma`. In CI it is run as part
of the build step.

---

## 4. Google OAuth Setup

Google OAuth requires configuration in two places: Google Cloud Console and the Supabase
dashboard. Both must be complete before sign-in works.

### Google Cloud Console

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Add to **Authorised redirect URIs**:
   ```
   https://[PROJECT-REF].supabase.co/auth/v1/callback
   ```
   Replace `[PROJECT-REF]` with the Supabase project reference (visible in the project URL).
4. Save and copy the **Client ID** and **Client Secret**

### Supabase dashboard

**Enable Google provider:**
→ Authentication → Providers → Google → toggle **Enable** → paste Client ID and Client Secret → Save

**Add redirect URLs:**
→ Authentication → URL Configuration → Redirect URLs → Add:
```
http://localhost:3000/auth/callback
https://[your-production-domain]/auth/callback
```

Both URLs are required. The localhost entry is for local development; without it,
OAuth redirects will fail with a `bad_oauth_state` error.

---

## 5. Supabase Email Templates

Supabase's default email templates use a `{{ .ConfirmationURL }}` link that triggers
the implicit (hash fragment) auth flow. hortlog uses the PKCE / token_hash flow
instead, so the templates must be updated to route through `/auth/callback`.

Go to **Supabase dashboard → Authentication → Email Templates** and update each template:

### Invite user

```html
<h2>You have been invited</h2>
<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite">Accept the invite</a></p>
```

### Confirm signup

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>
```

### Magic link

```html
<h2>Your magic link</h2>
<p>Follow this link to sign in:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink">Sign in</a></p>
```

### Reset password

```html
<h2>Reset password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset password</a></p>
```

> **Why:** The `{{ .ConfirmationURL }}` variable generates an implicit-flow link that
> puts the session token in the URL hash (`#access_token=...`). The hash is never sent
> to the server, so the callback route cannot read it. Using `token_hash` routes
> through `/auth/callback` server-side, where the OTP is verified and the session
> cookie is set correctly.

> **SiteURL:** Set this in Supabase → Authentication → URL Configuration → Site URL.
> For production it should be `https://hortlog.com`; for local dev use `http://localhost:3000`.

---

## 6. Running Locally

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

To verify the setup is correct before testing OAuth:

```bash
npm run type-check   # must pass with zero errors
npm run lint         # must pass with zero warnings
```

---

## 6. First Login

On the first Google OAuth sign-in, the app automatically creates a user row in the
`users` table via an upsert in `src/app/(app)/layout.tsx`. The row is keyed on the
Supabase auth UUID and populated from Google's `user_metadata` (`full_name`,
`avatar_url`).

No manual database seeding is required. Subsequent logins update the user's name and
avatar URL in case they changed in Google.

If the upsert fails (e.g. database connectivity issue), the layout logs the error and
renders anyway using an in-memory fallback — the session is not lost.
