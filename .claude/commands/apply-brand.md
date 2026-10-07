Apply a client brand to the project end-to-end: full multi-palette colour system
generation, design system, token application, typography, and documentation.

---

## INPUTS — Gather before touching any files

Ask the user for all five before proceeding.

| # | Input | Example |
|---|-------|---------|
| 1 | **Brand name** (lowercase, no spaces — used as palette prefix and folder name) | `acme` |
| 2 | **Primary hex colour** | `#2563eb` |
| 3 | **Industry / product type** | `B2B SaaS`, `fintech`, `healthcare` |
| 4 | **3 words describing the brand personality** | `trustworthy, modern, minimal` |
| 5 | **Palette relationship** | `complementary` / `analogous` / `triadic` / `split-complementary` / `let ui-ux-pro-max decide` (default) |

Do not proceed until all five are provided. If the user omits item 5, default to
`let ui-ux-pro-max decide` and pick the secondary/accent hues based on the
ui-ux-pro-max output in Step 2.

---

## Step 1 — Generate the full colour system

Derive five complete 11-shade scales (50–950) programmatically. Do not ask the
user to supply any hex values other than the primary.

### 1a — Shade generation algorithm

For each scale, given a base hex at shade 500:

**Lighter shades (50–400) — mix toward white:**

| Shade | White mix |
|-------|-----------|
| 50    | 95%       |
| 100   | 90%       |
| 200   | 75%       |
| 300   | 60%       |
| 400   | 40%       |

**Darker shades (600–950) — mix toward black:**

| Shade | Black mix |
|-------|-----------|
| 600   | 15%       |
| 700   | 30%       |
| 800   | 45%       |
| 900   | 60%       |
| 950   | 75%       |

Per-channel formula (R, G, B independently):
- Toward white: `result = round(channel + (255 - channel) * white_pct)`
- Toward black: `result = round(channel * (1 - black_pct))`

### 1b — Derive the five base hues

Convert the primary hex to HSL to derive companion hues, then convert each back
to hex before applying the shade algorithm above.

**Primary (500 = provided hex):** Use as-is.

**Secondary** — derive from primary HSL using the chosen relationship:

| Relationship | Secondary hue offset | Accent hue offset |
|---|---|---|
| `complementary` | +180° | +150° (split of complement) |
| `analogous` | +30° | +60° |
| `triadic` | +120° | +240° |
| `split-complementary` | +150° | +210° |
| `let ui-ux-pro-max decide` | Use complementary (+180°) as default; override after Step 2 if BRAND.md suggests a different palette | Same as complementary accent |

Hue rotation: `new_hue = (primary_hue + offset) % 360`

For secondary and accent, keep the same saturation as primary. Adjust lightness
to 45% for secondary (professional, slightly muted) and 55% for accent
(vivid, CTA-ready).

**Success** — fixed green family regardless of relationship:
Base hex: derive from HSL `(142, 71%, 45%)` → approximately `#16a34a`

**Destructive** — fixed red family:
Base hex: derive from HSL `(0, 84%, 60%)` → approximately `#ef4444`

### 1c — CSS variable naming

Name every token `--color-[brand]-[scale]-[shade]`:

```css
--color-acme-primary-50:      #eef2ff;
--color-acme-primary-100:     #e0e7ff;
/* ... */
--color-acme-primary-500:     #2563eb;  /* base */
/* ... */
--color-acme-primary-950:     #0a1640;

--color-acme-secondary-50:    ...;
/* ... through 950 */

--color-acme-accent-50:       ...;
/* ... through 950 */

--color-acme-success-50:      ...;
/* ... through 950 */

--color-acme-destructive-50:  ...;
/* ... through 950 */
```

---

## Step 2 — Run ui-ux-pro-max design system generator

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "<industry> <personality-word-1> <personality-word-2> <personality-word-3>" \
  --design-system \
  --persist \
  --stack shadcn \
  -p "<brand-name>" \
  -f markdown
```

This writes `design-system/<brand-name>/BRAND.md` — the source of truth for all
design decisions for this brand.

**After running**, read `design-system/<brand-name>/BRAND.md` and extract:
- **Heading Font** and **Body Font** — used in Step 4
- **Style name** and **Key Effects** — used in Step 2b
- **Palette relationship hint** — if `let ui-ux-pro-max decide` was chosen,
  check whether BRAND.md suggests a specific colour strategy; regenerate
  secondary/accent hues using the matching relationship if it differs from
  the complementary default used in Step 1

---

## Step 2b — Apply style recommendations from BRAND.md

Read the **Style name** and **Key Effects** fields from
`design-system/<brand-name>/BRAND.md` and apply whatever they specify directly
to `src/app/globals.css`. Do not invent values — use only what BRAND.md outputs.

### What to look for and where to apply it

**Border radius** — if Key Effects or Style mentions corner sharpness
(e.g. "sharp corners", "no border radius", "pill buttons", "rounded cards"):
- Update `--radius` in `:root` to match
- Add a short inline comment referencing the style (e.g. `/* Cyberpunk UI */`)
- If BRAND.md says nothing about corners, leave `--radius` at its current value

**Shadow style** — if Key Effects specifies a shadow or glow pattern
(e.g. "neon glow (text-shadow)", "soft drop shadows", "no shadows"):
- Add a CSS comment on the line after `--radius` documenting the pattern,
  so developers have a ready-made value to paste into components
- Format: `/* shadows: <effect> — box-shadow: <value> */`
- If BRAND.md says nothing about shadows, omit the comment

**Any other CSS-mappable recommendation** from Key Effects — apply the same
principle: if it maps to a CSS variable or token in `:root`, apply it; if it
does not map cleanly, add a comment noting the intent and skip the variable
change.

### What NOT to do

- Do not guess values from personality words
- Do not apply defaults "because it seems right for this style"
- Do not add tokens that BRAND.md did not mention

---

## Step 3 — Apply all tokens to globals.css

Open `src/app/globals.css`.

### 3a — Add all five scales to `@theme`

Locate the `@theme` block. Replace any previous brand palette (all non-`cod-gray`
colour tokens) with the new five scales. Keep `--color-cod-gray-*` intact.

**IMPORTANT: Always use a literal font-family string for `--font-sans`, not a `var()` reference.**
This is required for Storybook compatibility — `var(--font-*)` references are Next.js runtime
variables that do not exist outside the Next.js render context.

```css
@theme {
  /* fonts — use literal font-family strings for Storybook compatibility */
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-heading: 'Caveat', cursive;

  /* neutral — unchanged */
  --color-cod-gray-50: ...;
  /* ... */

  /* [Brand name] colour system */
  --color-acme-primary-50:     #eef2ff;
  /* ... all 11 primary shades ... */
  --color-acme-primary-950:    #0a1640;

  --color-acme-secondary-50:   ...;
  /* ... all 11 secondary shades ... */

  --color-acme-accent-50:      ...;
  /* ... all 11 accent shades ... */

  --color-acme-success-50:     ...;
  /* ... all 11 success shades ... */

  --color-acme-destructive-50: ...;
  /* ... all 11 destructive shades ... */
}
```

### 3b — Map to shadcn semantic variables in `:root`

Update the `:root` block using computed hex values (not Tailwind utility names):

```css
:root {
  --primary:                <acme-primary-500-hex>;
  --primary-foreground:     <acme-primary-50-hex>;
  --secondary:              <acme-secondary-500-hex>;
  --secondary-foreground:   <acme-secondary-50-hex>;
  --accent:                 <acme-accent-500-hex>;
  --accent-foreground:      <acme-accent-50-hex>;
  --destructive:            <acme-destructive-500-hex>;
  --ring:                   <acme-primary-500-hex>;
}
```

Leave `--background`, `--foreground`, `--muted`, `--border`, `--card`, and all
other semantic variables unchanged. Do not update `.dark` unless the user
explicitly requests it.

---

## Step 4 — Apply typography from BRAND.md

Read `design-system/<brand-name>/BRAND.md` for the typography recommendation.

### Font name → Next.js import name

Convert the font name to its `next/font/google` named export:
- Remove spaces, join with underscore, capitalise each word:
  `"Plus Jakarta Sans"` → `Plus_Jakarta_Sans`
- CSS variable: kebab-case with `--font-` prefix:
  `--font-plus-jakarta-sans`

### If heading and body fonts differ

Use the body font for `--font-sans`. Add a `--font-heading` variable and apply
it in the `@theme` block. Import both fonts in `layout.tsx`.

### Updates required

1. **`src/app/layout.tsx`**
   ```ts
   import { Plus_Jakarta_Sans } from 'next/font/google'
   const plusJakartaSans = Plus_Jakarta_Sans({
     subsets: ['latin'],
     variable: '--font-plus-jakarta-sans',
   })
   ```
   Update `<html>` className:
   ```tsx
   <html lang="en" className={plusJakartaSans.variable}>
   ```

2. **`src/app/globals.css`** — update `--font-sans` in both `@theme` and
   `@theme inline` blocks using a **literal font-family string**, not a `var()` reference.
   This is required for Storybook compatibility — `var(--font-*)` references are
   Next.js runtime variables that do not exist outside the Next.js render context.

   Always write the literal font family value (e.g. quoted font name with fallback):
   ```css
   /* ✅ Correct — works in Storybook and Next.js */
   --font-sans: 'Plus Jakarta Sans', sans-serif;

   /* ❌ Wrong — breaks Storybook, var(--font-*) is a Next.js runtime variable */
   --font-sans: var(--font-plus-jakarta-sans);
   ```

   For `--font-heading` (if heading/body fonts differ), apply the same rule:
   ```css
   --font-heading: 'Caveat', cursive;
   ```

   Do not use `var()` references in either `@theme` or `@theme inline` blocks for fonts.

If the user explicitly names a font that differs from BRAND.md, use their choice.

---

## Step 5 — Update docs/BRAND_GUIDE.md

Open `docs/BRAND_GUIDE.md` and update (replace existing values, do not append):

- **Project Identity** — brand name and personality words
- **Palette Relationship** — which relationship was used and why
- **Color Tokens** — for each of the five scales: scale name, base-500 hex,
  and intended usage (e.g. "primary: interactive elements, links, focus rings")
- **Typography** — font name(s), CSS variable(s), Google Fonts import URL from
  BRAND.md, `@theme` mapping
- **Design System** — path to `design-system/<brand-name>/BRAND.md` as source
  of truth, UI style name and key effects from BRAND.md

---

## Step 6 — Commit

```bash
git add \
  src/app/globals.css \
  src/app/layout.tsx \
  docs/BRAND_GUIDE.md \
  design-system/
git commit -m "brand: apply [brand-name] brand tokens and design system"
```

Replace `[brand-name]` with the actual brand name provided by the user.
