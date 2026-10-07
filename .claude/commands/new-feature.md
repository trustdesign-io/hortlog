---
description: Plan and implement a new feature end-to-end
---

# New Feature: $ARGUMENTS

## Process

Follow these steps in order. Do not skip any step.

### 1. Understand
- Read `CLAUDE.md`, `docs/ARCHITECTURE.md`, and `docs/CONVENTIONS.md` to understand the codebase context
- Identify existing patterns relevant to this feature
- List any unclear requirements and ask before proceeding

### 2. Plan
Before writing any code, produce:

**Feature brief:**
- What this feature does (user-facing description)
- Affected files and directories
- New files to create
- Database changes (if any — list Prisma model changes)
- API/server actions to create or modify
- UI components to create or modify
- Any external services involved

**Ask the user to confirm the plan before proceeding.**

### 3. Database (if needed)
- Update `prisma/schema.prisma`
- Run `npx prisma migrate dev --name [feature-name]`
- Update Prisma client types

### 4. Server layer
- Create server actions in `src/lib/actions/[feature].ts`
- Add Zod validation schemas
- Add error handling with try/catch returning result objects

### 5. UI layer
- Create components following `docs/CONVENTIONS.md`
- Use shadcn/ui components as building blocks
- Apply brand styles from `design-system/[brand-name]/MASTER.md` (see `docs/BRAND_GUIDE.md` for conventions)
- Add loading states (skeleton) and error states

### 6. Tests
- Write unit tests for utilities and server actions
- Write component tests for interactive UI
- Add E2E test if this is a user-facing flow

### 7. Verify
- Run `npm run lint && npm run type-check && npm run test && npm run build`
- Fix any errors before marking complete

### 8. Summary
Provide a brief summary of what was built, what files were changed, and any follow-up tasks.
