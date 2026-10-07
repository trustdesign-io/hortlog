---
description: Review code changes before a PR is opened
---

# Code Review

Review the current changes (or $ARGUMENTS if a specific file/area is specified) against the project's standards.

## Review Checklist

### Correctness
- [ ] Does the code do what it's supposed to do?
- [ ] Are edge cases handled?
- [ ] Is error handling complete and user-friendly?

### Conventions (`docs/CONVENTIONS.md`)
- [ ] Component structure follows the project pattern
- [ ] Naming conventions are consistent
- [ ] No `any` types
- [ ] Proper use of Server Components vs Client Components
- [ ] Imports are ordered correctly

### Security
- [ ] Server actions authenticate the user before operating on data
- [ ] No secrets or sensitive values exposed to the client
- [ ] User input is validated with Zod before use
- [ ] Supabase RLS policies account for this change

### Performance
- [ ] No unnecessary client-side rendering
- [ ] No N+1 database queries
- [ ] Images use `next/image`
- [ ] Heavy components are lazy-loaded if not above the fold

### Tests
- [ ] Unit tests for new utilities
- [ ] Component tests for interactive UI
- [ ] Existing tests still pass: `npm run test`

### Build
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run build` passes

## Output Format

For each issue found, state:
1. **Severity:** 🔴 Blocker / 🟡 Warning / 🟢 Suggestion
2. **File and line**
3. **Issue description**
4. **Suggested fix**

Then provide an overall assessment: Ready to merge / Needs changes.
