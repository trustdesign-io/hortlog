# Plan: hortlog

Generated from PRD.md on 2026-10-07.
Each item maps to one GitHub issue on Mission Control.

Phase 1 tickets → **Todo** (ready to start).
All other tickets → **Backlog**.

---

## Phase 1 — Foundation

> Schema, auth, and base structure. Everything else depends on this.

| # | Ticket | Category | Priority | Size |
|---|--------|----------|----------|------|
| 1 | Define full Prisma schema: Organisation, Membership, Species, Specimen, View, Collection, CollectionMembership, ViewShortCode | Backend | High | M |
| 2 | Customise auth pages (sign-in, sign-up, forgot-password) for hortlog brand skeleton | Frontend | High | S |
| 3 | Implement roles and permissions middleware: platform admin flag, MANAGER/MEMBER membership, capability checks | Backend | High | M |
| 4 | Org creation flow: new org form, slug generation, initial membership | Backend | High | M |

---

## Phase 2 — Brand & Design

> Tokens, typography, and core components. All subsequent UI tickets read PRD.md for brand decisions.

| # | Ticket | Category | Priority | Size |
|---|--------|----------|----------|------|
| 5 | Design tokens: CSS custom properties for all light/dark colour tokens, Tailwind config, theme provider with system default and manual toggle | Frontend | High | M |
| 6 | Typography: load Fraunces + Figtree variable fonts, configure Tailwind, global styles, `<ScientificName>` component (Fraunces italic) | Frontend | High | S |
| 7 | Core component library: Button variants, Input, Card, Badge, Avatar — all with light/dark states, Storybook stories | Frontend | High | L |
| 8 | Landing page: platform intro, Vantage explanation, sign-up CTA | Frontend | High | M |
| 9 | Base authenticated layout: header, navigation, mobile bottom nav | Frontend | High | M |

---

## Phase 3 — Platform: Organisations & People

| # | Ticket | Category | Priority | Size |
|---|--------|----------|----------|------|
| 10 | Org overview page (`/[org]`): collections summary, view count, specimen count | Frontend | High | M |
| 11 | Org settings page (`/[org]/settings`): name, slug, logo upload (Supabase Storage), role display labels | Frontend | High | M |
| 12 | Member management (`/[org]/members`): list members, invite by email (Supabase), assign MANAGER/MEMBER role | Frontend | High | M |
| 13 | User account settings (`/settings`): profile fields, avatar upload (Supabase Storage), password change | Frontend | Medium | M |

---

## Phase 4 — Platform: Content

> Species, collections, views, specimens. Core data that Vantage reads.

| # | Ticket | Category | Priority | Size |
|---|--------|----------|----------|------|
| 14 | Species browser (`/[org]/species`): search shared species records, detail drawer | Frontend | High | M |
| 15 | Collections CRUD (`/[org]/collections`): create, edit, delete, list specimens in collection | Frontend | High | M |
| 16 | Specimens list + add (`/[org]/specimens`, `/new`): list view, add form with species lookup, accession number, notes, lat/lng fields | Frontend | High | L |
| 17 | Specimen edit (`/[org]/specimens/[id]/edit`): all fields, collection membership (multi-select), grid placement indicator | Frontend | High | M |
| 18 | Views list + create (`/[org]/views`, `/new`): list all views, create with name, primary collection, grid dimensions | Frontend | High | M |

---

## Phase 5 — Vantage

> The first tool. QR → view page → specimen page.

| # | Ticket | Category | Priority | Size |
|---|--------|----------|----------|------|
| 19 | Grid editor (`/[org]/views/[id]/edit`): top-down grid, drag/click to place specimens in cells, remove from cell | Frontend | High | L |
| 20 | QR code generation: generate short code per view, render print-ready QR (hortlog.com/v/[code]), download as PNG/SVG | Frontend | High | M |
| 21 | QR short-link redirect (`/v/[code]`): resolve shortcode → redirect to view URL | Backend | High | S |
| 22 | Public view page — list (`/[org]/[collection]/[view]`): all specimens in view as a list, scientific names in Fraunces italic, mobile-first | Frontend | High | M |
| 23 | Public view page — grid (`/[org]/[collection]/[view]`): grid layout tab, cells showing specimen thumbnails, tap to go to specimen | Frontend | High | M |
| 24 | Public specimen detail page (`/[org]/[collection]/[view]/[specimen]` and `/[org]/specimens/[slug]`): full identification, description, habitat, uses, conservation status | Frontend | High | L |

---

## Phase 6 — Admin

> Platform admin interfaces. Scoped to Danny for Phase 1.

| # | Ticket | Category | Priority | Size |
|---|--------|----------|----------|------|
| 25 | Admin: species management (`/admin/species`): create, edit, search all shared species records | Frontend | High | M |
| 26 | Admin: org management (`/admin/orgs`): list all organisations, view membership counts | Frontend | Medium | S |

---

## Phase 7 — Launch Readiness

| # | Ticket | Category | Priority | Size |
|---|--------|----------|----------|------|
| 27 | Google Analytics GA4: add gtag script, page view tracking, event tracking on QR scans and specimen views | Frontend | High | S |
| 28 | Supabase Storage: buckets for org logos and specimen images, upload helpers, image display with next/image | Backend | High | M |
| 29 | SEO and meta tags: `<title>`, `<meta description>`, Open Graph tags on view and specimen pages | Frontend | Medium | S |
| 30 | Accessibility audit: keyboard navigation, ARIA labels, colour contrast check against brand tokens, focus states | Frontend | High | M |
| 31 | Performance pass: font loading strategy (display=swap, preload), image optimisation, Lighthouse check on public pages | Frontend | Medium | M |

---

## Ticket totals

| Phase | Tickets | Status |
|-------|---------|--------|
| Phase 1 — Foundation | 4 | Todo |
| Phase 2 — Brand & Design | 5 | Backlog |
| Phase 3 — Orgs & People | 4 | Backlog |
| Phase 4 — Content | 5 | Backlog |
| Phase 5 — Vantage | 6 | Backlog |
| Phase 6 — Admin | 2 | Backlog |
| Phase 7 — Launch | 5 | Backlog |
| **Total** | **31** | |
