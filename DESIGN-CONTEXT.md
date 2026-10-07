# Design Context

This file is the authoritative reference for any design agent working on this
project. Read it before planning or implementing any design work. It defines
what the template already provides so that new design work integrates
coherently rather than in isolation.

---

## Application structure

This is a Next.js app with two distinct route groups:

### Public / marketing (`/`)
- `/` — landing page (currently: default Next.js placeholder)

### Auth (`/sign-in`, `/sign-up`, `/forgot-password`)
- `/sign-in` — sign in with email/password via Supabase
- `/sign-up` — register with email/password via Supabase
- `/forgot-password` — password/username recovery via Supabase
- All three pages must reflect the brand palette and feel consistent with the
  landing page. They are NOT generic — they are part of the brand experience.
- Forms use shadcn `Input`, `Label`, `Button`, and `Field` components.

### App shell (authenticated pages)
- Protected by Supabase auth — only accessible when signed in
- Wrapped in a persistent sidebar layout (`src/components/sidebar.tsx`)
- Uses `UserMenu` component in the sidebar for avatar/logout

**The authenticated pages are project-specific and must be defined at design
planning stage.** The template ships with `/dashboard` and `/settings` as
placeholders, but these should be renamed and extended to reflect the actual
product. Examples:

| Product type | Authenticated pages |
|---|---|
| SaaS / admin | Dashboard, Analytics, Settings |
| E-commerce / lifestyle brand | Orders, Account, Wishlist |
| Content platform | Feed, Library, Profile, Settings |
| Booking / service | Bookings, History, Profile |

**Before planning any Design ticket, explicitly define what the authenticated
pages are for this product.** Do not default to "dashboard" unless it is
genuinely appropriate.

**Every design must account for all surfaces: landing, sign-in, sign-up, and
all authenticated pages. Designing only the landing page is incomplete.**

---

## Existing pages

| Route | File | Notes |
|-------|------|-------|
| `/` | `src/app/page.tsx` | Public landing page |
| `/sign-in` | `src/app/(auth)/sign-in/page.tsx` | Auth — Supabase email/password |
| `/sign-up` | `src/app/(auth)/sign-up/page.tsx` | Auth — Supabase email/password |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Auth — Supabase password reset |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | Protected app shell |
| `/settings` | `src/app/(app)/settings/page.tsx` | Protected app shell |

Brand-specific components go in `src/components/{brand}/`.

---

## Component library

All UI primitives are shadcn/ui components in `src/components/ui/`. When
applying a brand, reskin these via CSS tokens in `globals.css` — do not
rewrite the component files unless there is no alternative.

### Key components for design work

| Component | Used on |
|-----------|---------|
| `Button` | Everywhere — primary CTA, form submit, nav actions |
| `Input`, `Label`, `Field` | Sign-in, sign-up, settings forms |
| `Card` | Dashboard widgets, product cards |
| `Badge` | Status indicators, tags |
| `Avatar` | UserMenu, profile |
| `Sidebar` | App shell navigation |
| `UserMenu` | Sidebar footer — avatar, name, logout |
| `Sonner` | Toast notifications across all pages |
| `Dialog`, `Sheet` | Modal patterns |
| `Tabs` | Settings page sections |

---

## Token system

Brand tokens live in `src/app/globals.css` as CSS custom properties.

### Required semantic tokens (must be defined for every brand)

```css
/* Backgrounds */
--background        /* Page background */
--foreground        /* Primary text */
--card              /* Card/surface background */
--card-foreground
--popover           /* Dropdown/popover background */
--popover-foreground

/* Brand */
--primary           /* Primary action colour (CTAs, links) */
--primary-foreground
--secondary         /* Secondary surface */
--secondary-foreground

/* UI */
--muted             /* Subtle backgrounds */
--muted-foreground  /* Placeholder text, captions */
--accent            /* Hover highlight */
--accent-foreground
--destructive       /* Error, delete actions */
--border            /* Dividers, input borders */
--input             /* Input field background */
--ring              /* Focus ring */

/* Sidebar */
--sidebar            /* Sidebar background */
--sidebar-foreground
--sidebar-primary
--sidebar-primary-foreground
--sidebar-accent
--sidebar-accent-foreground
--sidebar-border
--sidebar-ring
```

All semantic tokens must be defined. Missing tokens will cause visual
inconsistencies on the auth pages and app shell.

### Raw palette tokens

Raw colour scales use the `--color-{scale}-{shade}` pattern and are displayed
in the Tokens Storybook story. Each brand should define a minimal set:
- One neutral/base scale (e.g. `--color-void-*`)
- One primary/accent scale (e.g. `--color-neon-*`)
- Any additional brand-specific scales

Do not leave old/default scales (e.g. `--color-cod-gray-*`) alongside new
brand scales — remove them when a brand replaces the defaults.

---

## Design checklist

Before any design work is considered complete, verify:

- [ ] Landing page designed and implemented
- [ ] Sign-in page reflects the brand (not generic shadcn defaults)
- [ ] Sign-up page reflects the brand (not generic shadcn defaults)
- [ ] Dashboard page has brand-appropriate layout and typography
- [ ] Settings page consistent with rest of app
- [ ] All semantic tokens defined in `globals.css`
- [ ] No orphaned/duplicate colour scales
- [ ] All interactive states: hover, focus, active, disabled
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Storybook stories for all new/modified components

---

## Adding new fonts

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`. Storybook
does not run through the Next.js runtime so font CSS variables are undefined
there by default.

**Whenever a new font is added to `layout.tsx`, you must do two things:**

1. Add the CSS variable shim to `.storybook/preview.ts`:
```ts
document.documentElement.style.setProperty('--font-your-font', '"Your Font"')
```

2. Add the Google Fonts `@import` to `.storybook/preview-head.html`:
```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=Your+Font&display=swap');
</style>
```

Both steps are required. The variable shim tells CSS what font name to use;
the `@import` actually loads the font file. Missing either causes fonts to
fall back to the system font in Storybook.

---

## Auth flow

Supabase handles authentication. The auth pages call `createClient()` from
`src/lib/supabase/client.ts`. In Storybook stories, mock this client — do
not use real credentials. See `src/stories/AuthProvider.stories.tsx` for
the mock pattern.
