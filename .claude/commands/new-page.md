---
description: Create a new page in the Next.js App Router
---

# New Page: $ARGUMENTS

## Process

### 1. Determine the route
- Confirm the URL path (e.g., `/dashboard/settings`)
- Is this page: public, auth-gated, or admin-only?
- Does it need a layout? Does an existing layout apply?

### 2. Create the route structure
Following Next.js App Router conventions:

```
src/app/[route]/
├── page.tsx          # The page component (Server Component by default)
├── layout.tsx        # Layout (only if this section needs its own layout)
├── loading.tsx       # Suspense loading UI (skeleton)
├── error.tsx         # Error boundary ('use client' required)
└── _components/      # Page-specific components not shared elsewhere
```

### 3. Implement the page

**Server Component page.tsx pattern:**
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Add metadata
export const metadata = {
  title: '[Page Title] | [App Name]',
  description: '[Description]',
}

export default async function [PageName]Page() {
  // Auth check (for protected pages)
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Fetch data
  const data = await fetchData()

  return (
    <main>
      {/* Page content */}
    </main>
  )
}
```

### 4. Add to navigation
- Update nav links if this page should appear in menus
- Add to sitemap if public-facing

### 5. SEO (for public pages)
- Set metadata title and description
- Add Open Graph tags if needed
- Ensure page is crawlable (check robots.txt)

### 6. Verify
- `npm run build` to check for errors
- Test on mobile viewport
- Check accessibility with keyboard navigation
