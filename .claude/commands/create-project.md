---
description: Create a new project from a starter template — scaffolds repo, runs PRD, creates design tickets, and kicks off work
---

# Create Project: $ARGUMENTS

Orchestrate the full project creation process from start to finish. This
command steps through each stage collaboratively with the user — never
rushing ahead or batching steps.

> **Read `.claude/SHARED_CONFIG.md` first** — it defines ORG, PROJECT_ID,
> GitHub identity, GraphQL quoting rules, and git workflow rules.

## CRITICAL — Step-by-step collaborative process

**Work through this one stage at a time.** After each stage, stop and wait
for the user to confirm before moving to the next.

The stages are:

0. **Choose template** → user picks starter-web, starter-static, starter-native, or starter-local
1. **Name & create repo** → user confirms name → repo created
1b. **Obsidian project folder** → create Projects/{name}/ in vault, promote from Ideas if applicable
2. **Infrastructure setup** → depends on template:
   - **starter-web** → Supabase + Vercel + deploy
   - **starter-static** → Vercel only (no database, no auth)
   - **starter-native** → Supabase + EAS configuration
3. **Run /prd** → collaborative PRD process → PRD.md and PLAN.md generated
4. **Create tickets** → tickets created on Mission Control from PLAN.md
5. **Begin work** → offer to run /take-task on the first ticket

Never skip a stage. Never combine stages. Always wait for user confirmation.

---

## Stage 0 — Choose the starter template

Ask the user:

> "Which starter template would you like to use?
>
> 1. **starter-web** — Next.js web app with Supabase, Prisma, and Vercel
> 2. **starter-static** — Next.js static site (no database, no auth)
> 3. **starter-native** — React Native / Expo mobile app
> 4. **starter-local** — Vite + React local-only web app (no auth, no deploy)"

Set `TEMPLATE_REPO` based on their answer:

- `starter-web` → `TEMPLATE_REPO=trustdesign-io/starter-web`
- `starter-static` → `TEMPLATE_REPO=trustdesign-io/starter-static`
- `starter-native` → `TEMPLATE_REPO=trustdesign-io/starter-native`
- `starter-local` → `TEMPLATE_REPO=trustdesign-io/starter-local`

**Stop and wait.**

---

## Stage 1 — Name and create the repository

Parse `$ARGUMENTS` for a project name. If not provided, ask the user:

> "What is the project name? This will be the GitHub repo name
> (e.g. `raretee`, `acme-dashboard`)."

Confirm the name with the user, then create the repo using the **user's
personal `gh` auth** (template cloning needs org owner perms).

**CRITICAL — Always scaffold into `~/Projects/trustdesign/`.**
All trustdesign projects live in this directory. Never clone into the current
working directory — always `cd` to the projects root first, regardless of
where this command is run from.

```bash
cd ~/Projects/trustdesign
gh repo create trustdesign-io/{name} --template $TEMPLATE_REPO --public --clone
```

If this fails with a permission error, tell the user what went wrong and
ask them to run the command. But this should work with their default auth.

Once created, set up:

```bash
cd ~/Projects/trustdesign/{name}
npm install
```

### Sync shared commands

Copy all shared slash commands from trustdesign-setup into the new project.
These commands (`/work-all`, `/take-task`, `/create-ticket`, etc.) are the
single source of truth in trustdesign-setup and must be present in every
project for the workflow to function.

```bash
cp ~/Projects/trustdesign/trustdesign-setup/.claude/commands/{board,create-ticket,deploy,fix-prs,move-ticket,prd,review-pr,sync-commands,take-task,update-ticket,work-all}.md ~/Projects/trustdesign/{name}/.claude/commands/
```

> **Do not skip this step.** Without shared commands, `/work-all` and
> `/take-task` will fail with "Unknown skill" errors.

Set the `PROJECT_TOKEN` repo secret so the auto-add-to-project workflow
can add new issues to Mission Control:

```bash
gh secret set PROJECT_TOKEN --repo trustdesign-io/{name} --body "$PROJECT_TOKEN"
```

If `$PROJECT_TOKEN` is not set in the environment, use the user's personal
`gh` token (it has project scope). Get it with:

```bash
gh auth token
```

Then set:

```bash
gh secret set PROJECT_TOKEN --repo trustdesign-io/{name} --body "$(gh auth token)"
```

Tell the user:

> "Repo is ready. Now let's set up the Obsidian project folder."

**Stop and wait.**

---

## Stage 1b — Create Obsidian project folder

Every promoted project gets a folder in the Obsidian vault at
`~/Projects/everything/Projects/{name}/` with three standard files.

### Create the project folder and files

```bash
mkdir -p ~/Projects/everything/Projects/{name}
```

Create these three files:

1. **Claude Context.md** — project overview, key conventions, current state,
   key files, decisions log. Use the template at
   `~/Projects/everything/Templates/Claude Context Template.md` as a starting
   point, but fill in what's known so far (repo URL, local path, tech stack
   from the template choice, Supabase project ref if created).

2. **Session Log.md** — start with today's date and a note that the project
   was scaffolded via `/create-project`.

3. **Todo.md** — start with "Up next" containing the remaining create-project
   stages, and "Backlog" as empty.

### If the project was previously an Idea

Check if `~/Projects/everything/Ideas/{name}/` exists. If it does:

- Update its `Brief.md` status from whatever it was to **Promoted**
- Add a wikilink to the new project folder:
  `> Project folder: [[Projects/{name}/Claude Context]]`
- **Do not move or delete the Ideas folder** — the Brief, Scratchpad, and
  PLAN are still useful reference material.

Tell the user:

> "Obsidian project folder created at Projects/{name}/ with Claude Context,
> Session Log, and Todo. Now let's set up the infrastructure."

**Stop and wait.**

---

## Stage 2 — Infrastructure setup

**This stage branches based on the template chosen in Stage 0.**

- If `starter-web` → follow **Stage 2W** (Supabase + Vercel)
- If `starter-static` → follow **Stage 2S** (Vercel only)
- If `starter-native` → follow **Stage 2N** (Supabase + EAS)
- If `starter-local` → follow **Stage 2L** (no infrastructure)

---

## Stage 2W — Set up Supabase, Vercel, and deploy (web only)

> **Skip this entire stage for starter-native projects. Go to Stage 2N instead.**

This stage creates the Supabase project, links to Vercel, sets all
environment variables, and deploys. Fully automated — no manual steps.

### 2Wa — Create Supabase project

If `supabase` CLI is not installed: `brew install supabase/tap/supabase`
If not logged in: `supabase login` (user completes browser auth)

Generate a secure database password:

```bash
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
```

Create the project:

```bash
supabase projects create {name} \
  --org-id tmukvgigbdtfbumhbfun \
  --db-password "$DB_PASSWORD" \
  --region eu-west-2
```

If `--org-id` fails, list orgs with `supabase orgs list` and
use the correct org ID. The trustdesign org ID is `tmukvgigbdtfbumhbfun`.

Wait for the project to be ready (can take 30-60 seconds), then get the
project ref and API keys:

```bash
PROJECT_REF=$(supabase projects list --output json | jq -r '.[] | select(.name == "{name}") | .id')
API_KEYS=$(supabase projects api-keys --project-ref "$PROJECT_REF" --output json)
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY=$(echo "$API_KEYS" | jq -r '.[] | select(.name == "anon") | .api_key')
SERVICE_ROLE_KEY=$(echo "$API_KEYS" | jq -r '.[] | select(.name == "service_role") | .api_key')
```

**Get the database connection strings from Supabase dashboard:**

Go to the Supabase dashboard → Connect → ORMs → Prisma tab. Copy the two
URLs shown there. They will look like this:

```
DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

> **CRITICAL — IPv4 compatibility:** Do NOT use the `db.PROJECT_REF.supabase.co`
> hostname. That direct hostname is IPv6-only and will not work from Vercel
> (which runs on IPv4). Always use the pooler hostname
> (`aws-0-REGION.pooler.supabase.com`) for both DATABASE_URL and DIRECT_URL.
> The Supabase dashboard "Connect → ORMs → Prisma" tab gives the correct URLs.

### 2Wb — Write .env.local

```bash
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DATABASE_URL=$DATABASE_URL
DIRECT_URL=$DIRECT_URL
EOF
```

Confirm `.env.local` is in `.gitignore` (it should be from the template).

### 2Wc — Push database schema and apply migrations

Push the Prisma schema to the new Supabase database to create all tables:

```bash
npx prisma db push
```

If this fails, check that `DATABASE_URL` in `.env.local` is correct and
that the Supabase project has finished provisioning.

Then baseline the migration history so future `prisma migrate deploy` calls
work in production:

```bash
npx prisma migrate resolve --applied 0001_initial
```

### 2Wd — Link Vercel and set environment variables

If `vercel` CLI is not installed: `npm i -g vercel`
If not authenticated: `vercel login` (user completes browser auth)

```bash
# Link the project to Vercel
vercel link --yes --scope dannychambers-projects

# Connect the GitHub repo for automatic PR previews and auto-deploy
vercel git connect --yes

# Set all environment variables on Vercel
# CRITICAL: use printf (not echo) to avoid trailing newline — echo adds \n
# which corrupts connection strings and causes P1001 errors
for ENV in production preview development; do
  printf '%s' "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL "$ENV" --scope dannychambers-projects
  printf '%s' "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "$ENV" --scope dannychambers-projects
  printf '%s' "$SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY "$ENV" --scope dannychambers-projects
  printf '%s' "$DATABASE_URL" | vercel env add DATABASE_URL "$ENV" --scope dannychambers-projects
  printf '%s' "$DIRECT_URL" | vercel env add DIRECT_URL "$ENV" --scope dannychambers-projects
done
```

If `vercel git connect` fails because the Vercel GitHub app doesn't have
access to the org, tell the user to visit
https://github.com/organizations/trustdesign-io/settings/installations
and grant Vercel access to all repositories. This only needs to happen once.

### 2We — Deploy

```bash
vercel --prod --yes --scope dannychambers-projects
```

After the deployment succeeds, tell the user:

> "Supabase and Vercel are set up. Environment variables configured for
> all environments.
>
> Supabase: https://supabase.com/dashboard/project/{PROJECT_REF}
> Production: https://{name}.vercel.app
>
> Now let's define the product."

**Stop and wait.** Then continue to Stage 3.

---

## Stage 2S — Set up Vercel (static only)

> **Skip this entire stage for starter-web and starter-native projects.**

Static projects don't need Supabase or a database. Just Vercel for hosting.

### 2Sa — Link Vercel and deploy

If `vercel` CLI is not installed: `npm i -g vercel`
If not authenticated: `vercel login` (user completes browser auth)

```bash
# Link the project to Vercel
vercel link --yes --scope dannychambers-projects

# Connect the GitHub repo for automatic PR previews and auto-deploy
vercel git connect --yes

# Deploy
vercel --prod --yes --scope dannychambers-projects
```

If `vercel git connect` fails because the Vercel GitHub app doesn't have
access to the org, tell the user to visit
https://github.com/organizations/trustdesign-io/settings/installations
and grant Vercel access to all repositories. This only needs to happen once.

### 2Sb — Write .env.local (if needed)

Static projects have minimal env vars. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `NEXT_PUBLIC_SITE_URL` to the Vercel production URL once deployed.

After the deployment succeeds, tell the user:

> "Vercel is set up and deployed.
>
> Production: https://{name}.vercel.app
>
> Now let's define the product."

**Stop and wait.** Then continue to Stage 3.

---

## Stage 2N — Set up Supabase and EAS (native only)

> **Skip this entire stage for starter-web projects. Go to Stage 2W instead.**

Native apps don't use Vercel. They use Expo Application Services (EAS) for
builds and OTA updates, and Supabase for user accounts and billing.

> **Expo Go first.** The starter-native template is designed to run in Expo Go
> out of the box — no dev builds needed for initial development. It ships with
> reanimated v3 (not v4), AsyncStorage (not MMKV), Sentry stubbed out, and
> `.npmrc` with `legacy-peer-deps=true`. Do not add native-only dependencies
> (MMKV, NitroModules, @sentry/react-native) until the project is ready to
> switch to dev builds.
>
> **Xcode compatibility:** Expo SDK 55 requires Xcode 26+ for local native
> builds (`npx expo run:ios`). If on Xcode 16.x, use `eas build` (cloud)
> or stick to Expo Go for development.

### 2Na — Create Supabase project

If `supabase` CLI is not installed: `brew install supabase/tap/supabase`
If not logged in: `supabase login` (user completes browser auth)

Generate a secure database password:

```bash
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
```

Create the project:

```bash
supabase projects create {name} \
  --org-id tmukvgigbdtfbumhbfun \
  --db-password "$DB_PASSWORD" \
  --region eu-west-2
```

If `--org-id` fails, list orgs with `supabase orgs list` and
use the correct org ID. The trustdesign org ID is `tmukvgigbdtfbumhbfun`.

Wait for the project to be ready, then get keys:

```bash
PROJECT_REF=$(supabase projects list --output json | jq -r '.[] | select(.name == "{name}") | .id')
API_KEYS=$(supabase projects api-keys --project-ref "$PROJECT_REF" --output json)
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY=$(echo "$API_KEYS" | jq -r '.[] | select(.name == "anon") | .api_key')
SERVICE_ROLE_KEY=$(echo "$API_KEYS" | jq -r '.[] | select(.name == "service_role") | .api_key')
```

### 2Nb — Write .env

```bash
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF
```

> **Note:** Native apps use `EXPO_PUBLIC_` prefix (not `NEXT_PUBLIC_`).
> The service role key stays server-side only — never bundle it into a
> mobile app. If needed later for edge functions, add it to Supabase
> dashboard secrets.

Confirm `.env` is in `.gitignore`.

### 2Nc — Configure EAS

If `eas-cli` is not installed: `npm i -g eas-cli`
If not logged in: `eas login` (user completes browser auth)

```bash
eas init
```

This registers the project with Expo and updates `app.json` with the EAS
project ID. Then create the EAS build profile:

```bash
eas build:configure
```

This generates `eas.json` with development, preview, and production profiles.

### 2Nd — Update app.json

Update `app.json` with project-specific values:

- `name` → display name (e.g. "Gitlist")
- `slug` → URL slug (e.g. "gitlist")
- `scheme` → deep link scheme (e.g. "gitlist")
- `ios.bundleIdentifier` → `io.trustdesign.{name}`
- `android.package` → `io.trustdesign.{name}`

### 2Ne — Verify build

Run a local development build check:

```bash
npx expo doctor
```

Fix any issues flagged. Then tell the user:

> "Supabase and EAS are set up.
>
> Supabase: https://supabase.com/dashboard/project/{PROJECT_REF}
> EAS: https://expo.dev (project registered)
>
> Run `npx expo start` to launch the dev server.
> Run `eas build --profile development --platform ios` for a dev build.
>
> Now let's define the product."

**Stop and wait.** Then continue to Stage 3.

---

## Stage 2L — No infrastructure (local only)

> **Skip this entire stage for starter-web, starter-static, and starter-native projects.**

Local projects have no hosted infrastructure. No Supabase, no Vercel, no EAS. The entire runtime is `npm run dev` on the developer's machine.

### 2La — Install dependencies

```bash
cd ~/Projects/trustdesign/{name}
npm install
```

### 2Lb — Verify it boots

```bash
npm run dev
```

Wait for the Vite dev server to start, confirm zero errors, then Ctrl-C.

### 2Lc — Skip env setup

`starter-local` ships with a comment-only `.env.example`. Do not create a `.env.local`. Local projects have no required env vars.

Tell the user:

> "starter-local project is installed and boots cleanly. No infrastructure to set up. Now let's define the product."

**Stop and wait.** Then continue to Stage 3.

---

## Stage 3 — Run the PRD process

Tell the user:

> "Starting the PRD process. I'll walk through each section with you."

Now follow the `/prd` command instructions **exactly** — step through
Product, Pages, Brand, and Technical questions one section at a time.
Generate `PRD.md` and `PLAN.md` in the project root.

After both documents are generated and approved, commit them via a PR:

```bash
git checkout -b docs/prd-and-plan
git add PRD.md PLAN.md
git commit -m "docs: add PRD and project plan"
git push -u origin HEAD
gh pr create --title "docs: add PRD and project plan" --body "Adds PRD.md and PLAN.md from the project kickoff." --base main
```

**Do not merge the PR.** The user always has final approval on merges.

Tell the user:

> "PRD and plan committed. Now let's create the tickets."

**Stop and wait.**

---

## Stage 4 — Create tickets on Mission Control

Tell the user:

> "I'll create tickets from PLAN.md on Mission Control. Here's what
> I'll create:"

List all the planned tickets with their Category, Priority, and Size.
Wait for user approval.

Then create each ticket using the `/create-ticket` process — full
descriptions with acceptance criteria generated from the PRD.

Phase 1 tickets go to **Todo** status. All others go to **Backlog**.

After all tickets are created, show a summary:

```
Tickets created on Mission Control

  Total   : {count}
  Todo    : {count} (Phase 1 — ready to start)
  Backlog : {count} (Phases 2-4)

  Board: https://github.com/orgs/trustdesign-io/projects/3
```

**Stop and wait.**

---

## Stage 5 — Begin work

Ask the user:

> "The board is set. Would you like me to start on the first ticket now?
> (/take-task next)"

If yes, run `/take-task next` to pick up the highest priority Todo ticket.

If no, tell the user:

> "Whenever you're ready, run `/take-task next` to start."

---

## Summary

For **starter-web** projects:

```
Project {name} created

  Repo     : https://github.com/trustdesign-io/{name}
  Supabase : https://supabase.com/dashboard/project/{PROJECT_REF}
  Live     : https://{name}.vercel.app
  PRD      : {name}/PRD.md
  Plan     : {name}/PLAN.md
  Board    : https://github.com/orgs/trustdesign-io/projects/3
  Tickets  : {count} created

  Run /take-task next to begin.
```

For **starter-static** projects:

```
Project {name} created

  Repo     : https://github.com/trustdesign-io/{name}
  Live     : https://{name}.vercel.app
  PRD      : {name}/PRD.md
  Plan     : {name}/PLAN.md
  Board    : https://github.com/orgs/trustdesign-io/projects/3
  Tickets  : {count} created

  Run /take-task next to begin.
```

For **starter-native** projects:

```
Project {name} created

  Repo     : https://github.com/trustdesign-io/{name}
  Supabase : https://supabase.com/dashboard/project/{PROJECT_REF}
  EAS      : https://expo.dev
  Bundle   : io.trustdesign.{name}
  PRD      : {name}/PRD.md
  Plan     : {name}/PLAN.md
  Board    : https://github.com/orgs/trustdesign-io/projects/3
  Tickets  : {count} created

  Run /take-task next to begin.
```

For **starter-local** projects:

```
Project {name} created

  Repo     : https://github.com/trustdesign-io/{name}
  Local    : ~/Projects/trustdesign/{name} (npm run dev)
  PRD      : {name}/PRD.md
  Plan     : {name}/PLAN.md
  Board    : https://github.com/orgs/trustdesign-io/projects/3
  Tickets  : {count} created

  Run /take-task next to begin.
```

---

## Rules

- **Never push directly to main** — all changes go through a PR, even docs, config, and workflow files
- Never rush through stages — each one needs user confirmation
- The PRD brand section must be completed before any design work
- All authenticated pages must be explicitly defined — never default to "dashboard"
- Every ticket gets a full description with acceptance criteria from the PRD
- Template is chosen at the start of the process (starter-web, starter-static, starter-native, or starter-local) — never assume a default
- PRD.md and PLAN.md are committed to the repo — they are living documents
