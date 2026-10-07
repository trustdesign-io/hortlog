# Research: Bencium Design Skill vs ui-ux-pro-max

**Issue:** #11
**Date:** 2026-03-13
**Category:** Research

---

## What is Bencium?

[Bencium](https://github.com/bencium) (Bence Csernak) is a third-party Claude Code skill marketplace at [github.com/bencium/bencium-marketplace](https://github.com/bencium/bencium-marketplace). It contains 13 plugins across design, productivity, and development categories.

The "bencium design skill" is not a single skill — it is a family of six design-focused skills. Two are directly relevant as potential upgrades to the existing `ui-ux-pro-max` skill.

---

## The two primary design skills

### `bencium-controlled-ux-designer` (v1.0.0)

**Philosophy:** "Always ask before implementing." Enforces an explicit approval gate before any design decision. Presents alternatives with trade-offs rather than making unilateral choices.

Best for: enterprise contexts, client-facing work, regulated industries, any project where consistency and audit trails matter.

Design approach: flat/minimal aesthetic — no shadows, gradients, or glass effects by default. Mathematical typography scale (1.25x from 16px base). 4px spacing grid. GPU-only animations with specified timing windows.

Reference files loaded on demand:
- `SKILL.md` — 27KB
- `ACCESSIBILITY.md` — 17KB (comprehensive WCAG 2.1 AA reference)
- `MOTION-SPEC.md` — 11KB
- `RESPONSIVE-DESIGN.md` — 13KB
- `DESIGN-SYSTEM-TEMPLATE.md` — 15KB

### `bencium-innovative-ux-designer` (v2.0.0, updated 2025-11-22)

**Philosophy:** "Bold creativity meets production rigor." Actively rejects generic AI defaults. Explicit list of prohibited patterns: Inter/Roboto/Arial, generic SaaS blue (#3B82F6), purple gradients on white, glass morphism, Apple mimicry, liquid blobs, cookie-cutter layouts.

Best for: campaigns, marketing sites, landing pages, any project where visual distinctiveness is a priority.

Offers 11 named tone options: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian.

Process: ask context questions → present 2–3 alternatives with trade-offs → commit boldly to chosen direction → implement with production precision.

---

## Comparison: bencium vs ui-ux-pro-max

| Dimension | ui-ux-pro-max | bencium (controlled) | bencium (innovative) |
|-----------|--------------|---------------------|---------------------|
| Core model | Searchable data library | Design approval protocol | Creative direction framework |
| Framework coverage | 13 stacks (React, Vue, Svelte, SwiftUI, Flutter, RN, etc.) | React/Next.js only | React/Next.js only |
| Color palettes | 96 enumerated palettes | Principles + anti-patterns only | 11 tone options |
| Font pairings | 57 enumerated pairings | No library | No library |
| Design styles | 67 named styles | Flat/minimal + anti-pattern list | 11 named tones |
| Chart support | 25 chart types | None | None |
| Accessibility depth | Priority rule + WCAG AA targets | 17KB dedicated reference file | 2.8KB reference file |
| Motion spec | Brief GPU/timing rules | 11KB dedicated spec | 2KB spec |
| Responsive spec | Viewport/breakpoint rules | 13KB dedicated spec | 2.3KB spec |
| Design system template | None | 15KB template | 15KB template |
| Decision style | Claude selects from data | Must ask before acting | Asks context, then commits boldly |
| shadcn/ui | Via MCP integration | Native (hard dependency) | Native (hard dependency) |
| Context window cost | SKILL.md + Python data tool | ~70KB if all reference files load | ~50KB if all reference files load |
| Maintenance | Third-party | Third-party, v1.0.0 | Third-party, v2.0.0 |

**Key conceptual difference:** `ui-ux-pro-max` is a design database — Claude consults it like a reference library and selects from enumerated options. Bencium skills are design philosophies — they govern how Claude reasons and when it is permitted to act versus when it must ask.

---

## Other skills in the marketplace worth noting

| Skill | Purpose |
|-------|---------|
| `bencium-impact-designer` | Production-grade interfaces; described as based on Anthropic's Frontend Designer skill (unverified) |
| `design-audit` | Visual-only UX audits with phased implementation plans; does not touch code |
| `typography` | Enforces professional typography rules (correct quotes, dashes, hierarchy) in generated HTML/CSS/React |
| `bencium-code-conventions` | React/Next.js/TypeScript/Tailwind/Supabase conventions — overlaps with this project's `CLAUDE.md` |

---

## Installation

Via Claude Code CLI (verify against current CLI docs — plugin API may have changed):
```
/plugin marketplace add bencium/bencium-marketplace
/plugin install bencium-controlled-ux-designer@bencium-marketplace
```

Manual (project-level): copy the skill's `skills/` directory into `.claude/skills/` — the same pattern already used for `ui-ux-pro-max` in this project.

---

## Known limitations

1. **React/Next.js only.** Hard dependency on shadcn/ui + Tailwind + Phosphor Icons + Sonner. Not suitable for Vue/Nuxt projects without adaptation.
2. **Reference files do not auto-load.** `ACCESSIBILITY.md`, `MOTION-SPEC.md`, and `RESPONSIVE-DESIGN.md` use progressive disclosure — they must be explicitly requested.
3. **No palette or font database.** Provides principles and anti-patterns but no enumerated library to select from.
4. **No chart support.** Neither design skill addresses data visualisation.
5. **Context window cost.** The controlled variant's full reference suite is approximately ~70KB (based on file size sums — actual token cost will vary). Meaningful overhead if all reference files load in a single session; reference files are on-demand, so everyday sessions need not pay this cost.
6. **Third-party, no Anthropic affiliation.** Community skills — maintenance depends on a single author.

---

## Recommendation

**Do not replace `ui-ux-pro-max`.** They solve different problems and are complementary.

`ui-ux-pro-max` is better as the **default day-to-day design skill** because it has broader framework coverage (Vue/Nuxt support matters for future projects), a searchable palette/font/style database, and chart guidance — none of which bencium offers.

**Consider adding `bencium-controlled-ux-designer`** as a companion for:
- Its deeper accessibility reference (17KB vs ui-ux-pro-max's brief rules) — useful to pull in when building accessible components
- Its 15KB `DESIGN-SYSTEM-TEMPLATE.md` — useful when bootstrapping a new client design system
- Enforcing an approval protocol on client-facing work where unilateral AI design decisions are undesirable

**Consider adding `bencium-innovative-ux-designer`** when:
- A specific page (marketing, landing) needs a high-creativity push
- The goal is to actively move away from AI-generic aesthetics

**Practical combination for this project:**
`ui-ux-pro-max` as primary + `bencium-controlled-ux-designer` installed alongside for its accessibility and motion reference files + `design-audit` for pre-PR visual review passes.

---

## Open questions

1. Is `bencium-impact-designer` meaningfully different from the innovative variant, or a near-duplicate? It claims to be based on Anthropic's Frontend Designer skill — worth checking if Anthropic's official version is now available directly.
2. How actively maintained is the controlled variant? v2.0.0 of innovative shipped 2025-11-22; controlled is still v1.0.0 with no noted update.
3. Does `bencium-code-conventions` add anything beyond what `CLAUDE.md` already defines for this stack (React/Next.js/TypeScript/Tailwind/Supabase)?

---

## Sources

- [bencium/bencium-claude-code-design-skill](https://github.com/bencium/bencium-claude-code-design-skill)
- [bencium/bencium-marketplace](https://github.com/bencium/bencium-marketplace)
- [bencium-innovative-ux-designer on Smithery](https://smithery.ai/skills/bencium/bencium-innovative-ux-designer)
- [Top 8 Claude Skills for UI/UX Engineers — Snyk](https://snyk.io/articles/top-claude-skills-ui-ux-engineers/)
