# Agentic Development Workflow

This document describes how development work flows through this project using Claude Code as the primary development agent.

---

## Overview

Work is tracked on **Mission Control** — a GitHub Projects board at `github.com/orgs/trustdesign-io/projects/3`. Claude Code handles the full loop: picking up tickets, implementing changes, opening PRs, self-reviewing them, and moving the ticket to In Review for human sign-off.

The human's role is to **define work** (create tickets), **review PRs**, and **merge**. Claude handles everything in between.

---

## The board

| Status | Meaning |
|--------|---------|
| Backlog | Defined but not yet prioritised for action |
| Todo | Ready to be picked up |
| In Progress | Claude is actively working on it |
| In Review | PR open, waiting for human review and merge |
| Done | Merged and closed |

Tickets have four fields: **Priority** (Critical → Low), **Size** (XS → XL), **Category** (Feature / Bug / Chore / Design / Docs / Research), and **Status**.

---

## Slash commands

All workflow actions are available as slash commands inside Claude Code.

### Board and tickets

| Command | What it does |
|---------|-------------|
| `/board` | Show open tickets for the current repo |
| `/board all` | Show tickets from all repos |
| `/board --all` | Show all repos including Done |
| `/create-ticket <title> [category:X] [priority:X] [size:X]` | Create an issue and add it to the board |
| `/update-ticket <number> [field:value ...]` | Update priority, size, category, status, title, or body |
| `/move-ticket <number> <status>` | Move a ticket to a different status column |

**Examples:**
```
/create-ticket Add user settings page category:Feature priority:High size:M
/update-ticket 42 priority:Critical
/move-ticket 42 "In Review"
```

### Doing the work

| Command | What it does |
|---------|-------------|
| `/take-task [next\|<number>\|<number> <number> ...]` | Pick up a ticket, implement it, open a PR, self-review, move to In Review |
| `/review-pr <number>` | Run a self-review sub-agent on an existing PR and post findings as a comment |

`/take-task next` picks the highest-priority **Todo** ticket for the current repo (Critical > High > Medium > Low; tiebreak: lowest number first). If no Todo tickets exist, it checks Backlog and asks before proceeding.

Pass multiple numbers (`/take-task 7 8 9`) to queue several tickets — Claude completes one before starting the next.

---

## End-to-end flow

```
Human                          Claude Code
  │                                │
  ├─ /create-ticket ───────────────┤  Creates GitHub issue + adds to board
  │                                │
  ├─ /move-ticket N todo ──────────┤  Moves to Todo (ready to pick up)
  │                                │
  ├─ /take-task next ──────────────┤
  │                                ├─ Moves ticket to In Progress
  │                                ├─ Creates feature branch
  │                                ├─ Implements the change
  │                                ├─ Runs: lint → type-check → unit tests → build
  │                                ├─ Commits and pushes
  │                                ├─ Opens PR
  │                                ├─ Self-review via sub-agent → posts comment
  │                                └─ Moves ticket to In Review
  │                                │
  ├─ Reviews PR on GitHub ─────────┤
  ├─ Merges PR ────────────────────┤  GitHub auto-closes the issue
  │                                │
  └─ /take-task next ──────────────┘  Pick up the next ticket
```

---

## Branch and commit conventions

**Branches** are named by category:
- Feature / Docs / Research → `feature/{number}-{slug}`
- Bug → `fix/{number}-{slug}`
- Chore → `chore/{number}-{slug}`

**Commits** follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add user settings page

Implements the profile settings form with display name and avatar upload.

Refs #42
```

Commit types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `design`.

PRs always target `main`. Never push directly to `main`.

---

## CI

Every PR (and every push to `main` or `staging`) runs `.github/workflows/ci.yml`, which gates merge on:

1. `npm ci` — install dependencies
2. `npx playwright install --with-deps chromium` — install E2E browser (E2E tests are not yet wired into CI)
3. `npx prisma generate` — generate Prisma client
4. `npm run lint`
5. `npm run type-check`
6. `npm run test` — Vitest unit tests
7. `npm run build`

On **merge to `main` only**, a second job runs `npx prisma migrate deploy` automatically (after the `ci` job passes).

Claude will not open a PR with a failing lint, type-check, or build. Errors are fixed on the branch before pushing.

---

## Design skills

This project has two Claude Code design skills installed. Use the right one for the task.

### `ui-ux-pro-max` — default for all UI work

Use this for day-to-day component and feature work. It provides a searchable library of 96 colour palettes, 57 font pairings, 67 named design styles, 25 chart types, and coverage for 13 frameworks including Vue/Nuxt.

Invoke it with `/ui-ux-pro-max` or just describe design work — it activates automatically on UI tasks.

### `bencium-controlled-ux-designer` — deeper specs and approval protocol

Use this when you need:
- The detailed accessibility reference (WCAG 2.1 AA, 17KB spec) when building complex accessible components
- The full motion/animation spec (11KB) for precise timing and GPU rules
- An explicit design approval protocol — Claude will ask before making any design decision rather than choosing unilaterally. Useful for client-facing work or when design consistency must be audited.

Invoke explicitly: `/bencium-controlled-ux-designer` (not installed by default — see [research findings](./research/bencium-design-skill.md) for installation steps).

### `bencium-innovative-ux-designer` — distinctive aesthetics

Use this when a specific page (marketing, landing, campaign) needs a high-creativity push away from generic AI-defaults. Provides 11 named tone options and an explicit list of prohibited patterns (generic blue, glass morphism, Apple mimicry, etc.).

Invoke explicitly: `/bencium-innovative-ux-designer` (not installed by default).

> See [`docs/research/bencium-design-skill.md`](./research/bencium-design-skill.md) for the full comparison, limitations, and installation instructions.

---

## Bot identity

> **Required:** `$TRUSTDESIGN_BOT_TOKEN` must be set in your shell before slash commands can post as the bot. If it is not set, actions fall back to your own authenticated token.

Tickets and PR comments from Claude appear under the **trustdesign-bot** GitHub account when the token is present. Bot setup is handled at the org level in `trustdesign-setup`.

---

## Human checkpoints

Claude operates autonomously but always stops for human input at:

1. **Before starting a Backlog ticket** — `/take-task next` will ask before touching a ticket that isn't in Todo
2. **After opening a PR** — Claude moves to In Review and waits; it never merges
3. **Ambiguous requirements** — if the issue body doesn't make "done" clear, Claude asks one focused question before continuing

For multi-day tasks, Claude will move the ticket back to Todo, add a comment explaining what's needed, and tell you rather than producing partial work.
