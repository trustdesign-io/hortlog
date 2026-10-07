# Human Setup Guide

A step-by-step guide for setting up a new project from the starter-web template.

> **For AI agents:** The companion setup guide is at `docs/SETUP.md`. That file covers
> the same steps but is written as instructions for Claude Code, not a human.

---

## 1. Create a new repo from the template

1. Go to [github.com/trustdesign-io/starter-web](https://github.com/trustdesign-io/starter-web)
2. Click **Use this template** → **Create a new repository**
3. Set the owner to **trustdesign-io**
4. Give it a name (e.g. `acme-web`)
5. Set visibility to **Private**
6. Click **Create repository**

---

## 2. Clone it locally

```bash
git clone https://github.com/trustdesign-io/your-repo-name.git
cd your-repo-name
npm install
```

---

## 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose the **trustdesign** organisation
4. Give the project a name and set a strong database password — **save this password now**, you will need it in the next step
5. Choose a region close to your users and click **Create new project**
6. Wait for the project to finish provisioning (about 1–2 minutes)

Once it's ready, collect the following from the Supabase dashboard:

| What | Where to find it |
|------|-----------------|
| Project URL | Settings → API → Project URL |
| Anon key | Settings → API → Project API keys → `anon` `public` |
| Direct connection string | Settings → Database → Connection string → **Direct connection** tab |

> **Important:** Use the **Direct connection** tab, not the pooler. The pooler connection does not work with Prisma migrations.

---

## 4. Set up environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=         # paste your Project URL here
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # paste your anon key here
SUPABASE_SERVICE_ROLE_KEY=        # Settings → API → service_role key
DATABASE_URL=                     # paste the direct connection string here
DIRECT_URL=                       # paste the same direct connection string again
```

**For `DATABASE_URL` and `DIRECT_URL`**, the connection string looks like:

```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` — including the square brackets — with the database password
you saved in step 3. The final string should contain no brackets.

> Both `DATABASE_URL` and `DIRECT_URL` use the same direct connection string.

---

## 5. Run database migrations

Generate the Prisma client and push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

If `db push` fails with an authentication error, double-check that the password in your
connection string is correct and that you are using the direct connection (not pooler).

---

## 6. Set up Google OAuth

### In Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Under **Authorised redirect URIs**, add:
   ```
   https://[your-supabase-project-ref].supabase.co/auth/v1/callback
   ```
   Replace `[your-supabase-project-ref]` with the ref from your Supabase project URL
   (e.g. `abcdefghijklmnop`).
7. Click **Create** and copy the **Client ID** and **Client Secret**

### In Supabase

1. Go to **Authentication → Providers → Google**
2. Toggle **Enable Google provider**
3. Paste the Client ID and Client Secret
4. Click **Save**

5. Go to **Authentication → URL Configuration**
6. Under **Redirect URLs**, click **Add URL** and add:
   ```
   http://localhost:3000/auth/callback
   ```

---

## 7. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

Click **Continue with Google** and sign in. The first login automatically creates your
user record in the database — no manual setup required.

---

## 8. Apply client branding

1. Go to [uicolors.app](https://uicolors.app)
2. Enter the client's primary hex colour to generate a full palette
3. Click **Export** and select **Tailwind 4** format — copy the CSS variables
4. Open Claude Code in the project folder:
   ```bash
   claude
   ```
5. Type `/apply-brand` and follow the prompts — paste the CSS variables when asked

Claude will update `globals.css`, `layout.tsx` (font from design system recommendation),
`docs/BRAND_GUIDE.md`, and `design-system/[brand-name]/MASTER.md` automatically.

---

## 9. Running Storybook

Storybook shows all UI components rendered with the current brand tokens.

```bash
npm run storybook
```

Then open [http://localhost:6006](http://localhost:6006). You'll see every shadcn/ui component organised in the sidebar, plus a Tokens page showing the full colour and typography scale.

After running `/apply-brand`, restart Storybook to see the new brand colours applied across all components.

---

## 10. Hand to Claude Code for development

1. Open Claude Code in the project folder:
   ```bash
   claude
   ```
2. Claude reads `CLAUDE.md` and `docs/SETUP.md` automatically at the start of each session
3. Describe the feature you want built in plain English — for example:
   - *"Add a settings page where users can update their display name"*
   - *"Create a dashboard that shows the last 10 sign-ins"*

Claude will ask clarifying questions if needed, then implement the feature following
the project's conventions.
