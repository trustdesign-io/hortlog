# Coding Conventions

This document is the authoritative reference for how code is written in this project. Follow it consistently — Claude will use this file when generating or reviewing code.

## Component Anatomy

Every React component follows this order:

```tsx
// 1. External imports
import { useState } from 'react'
import { cn } from '@/lib/utils'

// 2. Internal imports
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'

// 3. Type imports
import type { User } from '@/types'

// 4. Local types (if needed only in this file)
interface UserCardProps {
  user: User
  onSelect?: (id: string) => void
  className?: string
}

// 5. Component (named export)
export function UserCard({ user, onSelect, className }: UserCardProps) {
  // a. Hooks first
  const currentUser = useCurrentUser()
  const [isExpanded, setIsExpanded] = useState(false)

  // b. Derived state / computations
  const isOwner = currentUser?.id === user.id

  // c. Handlers
  function handleSelect() {
    onSelect?.(user.id)
  }

  // d. Render
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      {/* ... */}
    </div>
  )
}

// 6. Helper functions (below the component, not inside it)
function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`
}
```

## TypeScript Rules

```ts
// ❌ Never use `any`
function process(data: any) {}

// ✅ Use unknown for truly unknown types, then narrow
function process(data: unknown) {
  if (typeof data === 'string') { /* ... */ }
}

// ❌ Don't type-cast without good reason
const user = data as User

// ✅ Validate and narrow instead (use Zod)
const user = UserSchema.parse(data)

// ✅ Use satisfies for config objects to get inference + validation
const config = {
  theme: 'dark',
  locale: 'en-GB',
} satisfies AppConfig
```

## Server Actions

All data mutations go through Server Actions, not API routes (unless external consumption is needed).

```ts
// src/lib/actions/user.ts
'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
})

export async function updateProfile(formData: FormData) {
  // 1. Authenticate
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // 2. Validate
  const input = UpdateProfileSchema.parse({
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
  })

  // 3. Mutate
  await prisma.user.update({
    where: { id: user.id },
    data: input,
  })

  // 4. Revalidate
  revalidatePath('/profile')
}
```

## Error Handling

```ts
// Server Actions: return result objects, don't throw to client
export async function createPost(data: CreatePostInput) {
  try {
    const post = await prisma.post.create({ data })
    return { success: true, post }
  } catch (error) {
    console.error('Failed to create post:', error)
    return { success: false, error: 'Failed to create post. Please try again.' }
  }
}

// Components: use useFormState for server action errors
// UI: always show user-friendly messages, never raw error strings
```

## Prisma Conventions

```prisma
// schema.prisma conventions:

model User {
  id        String   @id @default(cuid())  // cuid() for all IDs
  email     String   @unique
  createdAt DateTime @default(now())       // always include timestamps
  updatedAt DateTime @updatedAt

  // Relations: camelCase, with explicit foreign key
  posts     Post[]
  profile   Profile?
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId  String                          // explicit FK field
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])                       // index every FK
}
```

## Tailwind & shadcn/ui

```tsx
// Use cn() for conditional classes (from @/lib/utils)
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className  // always accept and spread className prop
)} />

// Don't use arbitrary values unless no utility exists
// ❌ className="w-[437px]"
// ✅ className="w-full max-w-md"

// Variant pattern for component variants
const variants = cva('base-classes', {
  variants: {
    intent: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: { intent: 'primary', size: 'md' },
})
```

## Zustand Stores

```ts
// src/stores/auth-store.ts
import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
}))
```

## Testing

```ts
// Unit tests: co-located with the file they test
// src/lib/utils/format-date.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from './format-date'

describe('formatDate', () => {
  it('formats a date in UK format', () => {
    expect(formatDate(new Date('2026-03-11'))).toBe('11 March 2026')
  })
})

// Component tests: use React Testing Library
// E2E tests: in /tests/e2e/ using Playwright
```

## File Organisation Rules

- One component per file
- Keep files under 300 lines — if larger, split into subcomponents
- Shared types go in `src/types/index.ts` or dedicated files in `src/types/`
- Server-only code goes in `src/lib/server/` — never import in client components
- All Prisma queries go through `src/lib/prisma.ts` singleton
