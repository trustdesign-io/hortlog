---
description: Create a new reusable React component
---

# New Component: $ARGUMENTS

## Process

### 1. Clarify before building
- What does this component render?
- What props does it accept?
- Is it a Server Component or does it need `'use client'`?
- Where will it live? (`src/components/` for shared, `app/[route]/_components/` for page-specific)
- Does a similar shadcn/ui component already exist that should be extended instead?

### 2. Create the component

Follow the component anatomy in `docs/CONVENTIONS.md`:

```tsx
// src/components/[component-name].tsx

import { cn } from '@/lib/utils'
import type { ComponentProps } from '@/types'

interface [ComponentName]Props {
  // props here
  className?: string  // always include className
}

export function [ComponentName]({ className, ...props }: [ComponentName]Props) {
  return (
    <div className={cn('', className)}>
      {/* content */}
    </div>
  )
}
```

### 3. Variant support (if needed)
Use `cva` from `class-variance-authority` for components with multiple visual variants.

### 4. Accessibility
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigability for interactive components
- Test with Tab key navigation

### 5. Apply brand styles
Refer to `design-system/[brand-name]/MASTER.md` for colours, typography, spacing, and border radius tokens. See `docs/BRAND_GUIDE.md` for UI component defaults and conventions.

### 6. Write tests
- Add `[component-name].test.tsx` alongside the component
- Test: renders correctly, handles interactions, handles edge cases

### 7. Document with JSDoc
```tsx
/**
 * [Brief description of what this component does]
 *
 * @example
 * <ComponentName prop="value" />
 */
export function ComponentName(props: ComponentNameProps) {
```
