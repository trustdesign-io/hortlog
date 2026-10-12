---
description: Run a WCAG 2.1 AA accessibility audit on the current project
---

# Audit Accessibility: $ARGUMENTS

Run a comprehensive WCAG 2.1 AA accessibility audit on the current project
and produce a structured report with actionable fixes.

> **Read `.claude/rules/accessibility.md` first** — it defines the standards
> every trustdesign project must meet.

---

## Step 1 — Determine scope

Parse `$ARGUMENTS`:
- Path given (e.g. `src/components/Footer.tsx`) — audit that file only
- Component name given (e.g. `Footer`) — find and audit that component
- Empty — audit the full page: layout, page.tsx, and all rendered components

---

## Step 2 — Read all in-scope files

Read every component that renders on the page (or the specified scope).
For a full-page audit this includes at minimum:
- `src/app/layout.tsx`
- `src/app/page.tsx` (or the relevant route)
- Every component imported by the page
- Global CSS (`globals.css` or equivalent)
- Theme/token files for colour values

---

## Step 3 — Audit against WCAG 2.1 AA

Check each category systematically. For every finding, note the file, line,
WCAG criterion, severity, and a concrete fix.

### 3a — Document outline
- Exactly one `<h1>` per page, always rendered (never conditional)
- No skipped heading levels (h1 → h2 → h3)
- Headings describe section content

### 3b — Landmarks
- Every visible region inside a landmark
- Only one `<main>`
- Multiple `<nav>` / `<aside>` each have unique `aria-label`
- No orphaned content outside landmarks

### 3c — Interactive elements
- Clickable = `<button>` or `<a>`. No `onClick` on `<div>`/`<span>`
- Non-standard interactive elements have `role`, `tabIndex`, keyboard handler, `aria-label`
- Toggle elements have `aria-pressed` or `aria-expanded`
- All buttons have explicit `type`
- Visible focus indicators on every interactive element
- Touch targets ≥ 44×44px

### 3d — Images & icons
- Meaningful images have descriptive `alt`
- Decorative images have `alt=""` OR `aria-hidden="true"` (not both)
- Icon-only buttons have `aria-label`

### 3e — Colour contrast
Calculate contrast ratios for all foreground/background pairs in the theme:
- Normal text: ≥ 4.5:1
- Large text (18px+ or 14px+ bold): ≥ 3:1
- UI components: ≥ 3:1
- Flag any hardcoded hex values not from the theme

Use this formula for relative luminance:
```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
(where R, G, B are linearised: if sRGB ≤ 0.04045 then C/12.92, else ((C+0.055)/1.055)^2.4)
Contrast ratio = (L1 + 0.05) / (L2 + 0.05) where L1 > L2
```

### 3f — Forms
- Every input has a `<label>` or `aria-label`
- Errors associated via `aria-describedby`
- Required fields marked with `aria-required` or `required`

### 3g — Dynamic content
- Updates use `aria-live`
- Modals trap focus and return it on close
- Loading states announced with `aria-busy`

### 3h — Motion
- `prefers-reduced-motion` respected in CSS
- Marquee/carousel duplicates `aria-hidden`

### 3i — Iframes & lang
- All `<iframe>` have `title`
- `<html lang="...">` set correctly

---

## Step 4 — Produce the report

Output a structured report:

```
## Accessibility Audit

**Standard:** WCAG 2.1 AA
**Scope:** {files audited}
**Issues:** {total} | Critical: {n} | Major: {n} | Minor: {n}

### Findings

| # | File | Line | Issue | WCAG | Severity | Fix |
|---|------|------|-------|------|----------|-----|
| 1 | ... | ... | ... | 1.3.1 | Critical | ... |

### Contrast Check

| Element | Foreground | Background | Ratio | Required | Pass |
|---------|-----------|------------|-------|----------|------|
| ... | ... | ... | ...:1 | 4.5:1 | ✓/✗ |

### Passing

{List what's already correct — landmarks, focus styles, live regions, etc.}
```

---

## Step 5 — Offer to fix

If issues were found:

```
Found {n} issues. Want me to fix them now?
```

If the user says yes, fix all issues in priority order (critical → major → minor)
and re-run the audit to verify.

---

## Notes

- This command can be run at any point during development
- Integrates with the design ticket verification in `/take-task`
- The accessibility rule (`.claude/rules/accessibility.md`) enforces standards
  during normal development — this command is for comprehensive audits
- Run before every PR that touches UI components
