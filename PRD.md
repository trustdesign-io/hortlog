# PRD: hortlog

**Version:** 1.0
**Date:** 2026-10-07
**Status:** Draft

---

## Overview

hortlog is a platform of horticultural tools for organisations that manage plants — botanical gardens, woodland managers, and mixed sites. The first tool, Vantage, lets a visitor scan one QR code and see every specimen visible from where they stand, however far back it is planted, with rich identification and interpretation that a physical label can never hold. The platform is designed to host several tools; Vantage is the first.

## Problem Statement

In botanical gardens like Kew, many specimens are planted too far from paths to read their labels. A visitor standing in front of a glasshouse bed can see the plants but cannot identify them. When a label is readable, it carries a fixed name and origin — it cannot describe the plant in depth, update its conservation status, or say what is interesting about it right now. Vantage solves the distance problem with a single scannable code at the vantage point, and the content problem by giving each specimen its own living page.

## Target Audience

- **Visitors** — members of the public at a botanical garden or woodland. No account, no install, public access only.
- **Horticultural workers** — staff, volunteers and students who maintain and document specimens. Authenticated editors scoped to their organisation.
- **Woodland managers** — log individual trees with tag, measurements and history (Phase 2 tool). Same platform, different vocabulary.
- **Platform admin (Danny)** — access to shared species records and all organisations.

## Product Type

SaaS platform — multi-org, multi-tool, with public read access and authenticated editing.

---

## Vocabulary

| Term | Definition |
|------|------------|
| **View** | The physical thing a visitor stands in front of: a bed, a rockery, a pond. Carries the QR code, holds specimens. |
| **Vantage point** | Where the QR code is placed, and where the visitor stands to scan. |
| **Collection** | A themed set of plants (e.g. Madagascar). Not a place. |
| **Species** | A shared record of the plant itself, used across all organisations. |
| **Specimen** | An individual plant or planting of a species, belonging to one organisation. |

---

## Pages & Routes

### Public (no login required)

| Route | Page | Notes |
|-------|------|-------|
| `/` | Landing | Platform marketing and Vantage intro |
| `/sign-in` | Sign in | Email/password via Supabase |
| `/sign-up` | Sign up | Email/password via Supabase |
| `/forgot-password` | Password reset | Reset link via Supabase |
| `/v/[code]` | QR redirect | Short link → view URL |
| `/[org]/[collection]/[view]` | View page | Public list + grid of specimens |
| `/[org]/[collection]/[view]/[specimen]` | Specimen detail | Full identification + interpretation |
| `/[org]/specimens/[slug]` | Specimen (no view) | Specimens not placed in a view |

### Authenticated

| Route | Page | Notes |
|-------|------|-------|
| `/settings` | Account settings | Profile, avatar, password |
| `/[org]` | Org overview | Collections, views, specimen count |
| `/[org]/settings` | Org settings | Profile, logo, role display labels |
| `/[org]/members` | Member management | Invite members, assign roles — manager only |
| `/[org]/species` | Species browser | Search shared species records |
| `/[org]/collections` | Collections | Manage themed sets |
| `/[org]/specimens` | Specimens list | All specimens for this org |
| `/[org]/specimens/new` | Add specimen | Form with species lookup |
| `/[org]/specimens/[id]/edit` | Edit specimen | All fields, collection membership, placement |
| `/[org]/views` | Views list | All views for this org |
| `/[org]/views/new` | Create view | Name, primary collection |
| `/[org]/views/[id]/edit` | Edit view | Grid editor — place specimens in cells, generate QR |
| `/admin/species` | Admin: species | Create/edit shared species records |
| `/admin/orgs` | Admin: orgs | All organisations, platform-wide |

---

## Data Model

### Species (shared, platform-wide)
Fields: `slug`, `commonName`, `scientificName`, `family`, `origin`, `description`, `conservationStatus`
Written once; used by every organisation that grows it.

### Organisation
Fields: `slug`, `name`, `logo`, `managerLabel`, `memberLabel`
No "type" field — one org can be garden, woodland, or both. Display labels for roles are set per org.

### Membership
Links a user to an organisation with a role (`MANAGER` or `MEMBER`).
One user can hold different roles in different organisations.
Platform admin is a field on the user, separate from memberships.

### Specimen
Fields: `slug`, `accessionNumber`, `notes`, `gridCell`, `latitude`, `longitude`
Belongs to an organisation; linked to a species.
Optionally placed in a view (grid cell); optionally has lat/lng coordinates.
Can belong to multiple collections, or none.
Owns its own URL.

### View
Fields: `slug`, `name`, `gridRows`, `gridCols`, `shortCode`
Belongs to an organisation; has one primary collection (for URL).
QR short code generates `hortlog.com/v/[shortCode]`.

### Collection
Fields: `slug`, `name`, `description`
Belongs to an organisation. Membership belongs to the specimen, not the view.

---

## Features & Requirements

### Must have (Phase 1)

**Platform**
- Sign-up, sign-in, forgot-password, email verification
- User profile with avatar (Supabase Storage)
- Organisations with logo, slug, and per-org role display labels
- Roles and permissions: platform admin, manager, member
- Permission checks on capability names (`can_edit_specimen`), not role names
- Member invites via email (Supabase built-in)
- Shared species records (admin-created)
- Collections, views, and specimens as core data
- Supabase Storage for logos and images

**Vantage**
- Grid editor: place specimens in a view's cells
- QR code generation per view (downloadable, print-ready)
- QR short-link redirect (`/v/[code]`)
- Public view page: specimen list
- Public view page: grid layout
- Public specimen detail page
- Scientific names in Fraunces italic throughout

**Platform-wide**
- Light/dark theme with system default and manual toggle
- Google Analytics (GA4) on all pages

### Should have
- Specimen search within an org
- Species search when adding a specimen
- Touch-friendly grid editor
- Org onboarding flow

### Nice to have (future phases)
- Personal species history on user profile (working log)
- Tree logging tool for woodland managers
- Richer layouts: freehand maps, photo overlays
- Resend for branded transactional email
- Data import from IUCN Red List / Plants of the World Online

---

## Brand

### Identity
- **Name:** hortlog
- **Personality:** Calm, professional, botanical. Not rustic, not playful.
- **Tone of voice:** Precise but accessible. Speaks to curious visitors and professionals alike.

### Typography
- **Headings:** Fraunces (variable, Google Fonts)
- **Scientific names:** Fraunces italic — applied to every *genus species* string throughout the product. This is a hard rule.
- **Body / UI:** Figtree (variable, Google Fonts)

### Colour system

#### Light theme
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#305834` | Primary actions, links |
| Primary hover | `#1E3A23` | |
| Background | `#F2F1E4` | Page background |
| Surface | `#FBFAF3` | Cards, panels |
| Text | `#1C2620` | Body copy |
| Muted | `#5F6F60` | Secondary text, labels |
| Tint | `#DCE5D3` | Selected grid cells, tags, highlights |
| Accent | `#A84A22` | Alerts and key CTAs only |

#### Dark theme
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#8FBF8A` | |
| Primary hover | `#A9D1A4` | |
| Background | `#121A14` | |
| Surface | `#1A251D` | |
| Text | `#E8E9DC` | |
| Muted | `#9BA89B` | |
| Tint | `#24382A` | |
| Accent | `#E08A5E` | |

#### Button rules
- **Light:** Primary button = `#305834` fill, `#FBFAF3` label
- **Dark:** Primary button = `#8FBF8A` fill, `#121A14` label
- **Logo mark:** `#305834` on light, `#8FBF8A` on dark
- **Accent:** One per screen maximum — alerts and single key CTA only

### Design constraints
- Mobile-first — every page designed at 375px first
- System colour scheme by default, manual toggle available
- Fraunces italic on every scientific name — no exceptions
- No generic SaaS aesthetics — content leads, chrome recedes
- All interactive elements must have hover, focus, and active states
- Responsive at 375px, 768px, 1024px, 1440px minimum

---

## Technical Requirements

- **Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Prisma
- **Deployment:** Vercel (live at hortlog.vercel.app)
- **Database:** Supabase Postgres (provisioned)
- **Storage:** Supabase Storage — org logos, specimen images
- **Auth:** Supabase Auth (email/password)
- **Analytics:** Google Analytics GA4
- **QR codes:** Generated in-app, downloadable for print
- **Email:** Supabase built-in for auth and member invites (Phase 1)
- **Target device:** Mobile-first — public Vantage pages especially
- **Performance:** Core Web Vitals green, LCP < 2.5s

---

## URL Structure

```
hortlog.com/                                        Landing
hortlog.com/v/7k3f                                  QR short link → view redirect
hortlog.com/kew/madagascar/bed-1                    View page (public)
hortlog.com/kew/madagascar/bed-1/strelitzia-01      Specimen detail
hortlog.com/kew/specimens/strelitzia-01             Specimen with no view
```

---

## Roles & Permissions

| Role | Scope | Stored as | Default display label |
|------|-------|-----------|----------------------|
| Platform admin | All orgs | User flag | — |
| Manager | One org | `MANAGER` | "Garden manager" / "Woodland manager" |
| Member | One org | `MEMBER` | "Horticulturalist" / TBD |

Display labels are set per organisation, not derived from an org type.

---

## Open Questions

- Display label for the Member role in a woodland
- Do Kew's existing labels carry a machine-readable accession number that could be reused?
- What does success look like for an org: fewer unidentifiable plants, longer dwell time, more science engagement?
- How does "who is working on this" content get maintained on specimen pages?
- Password-protection mechanism if Kew demo needs gating before consent is confirmed

---

## Success Criteria

- [ ] All pages listed above implemented and responsive at 375px, 768px, 1024px, 1440px
- [ ] Public view and specimen pages load without login, account or install
- [ ] QR code generated per view, downloadable for print
- [ ] Fraunces italic applied to all scientific names throughout
- [ ] Light/dark theme with system default and manual toggle working
- [ ] GA4 tracking on all public pages
- [ ] CI passing: lint, type-check, tests, build
