'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { List, Grid2X2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewTabNavProps {
  basePath: string
}

export function ViewTabNav({ basePath }: ViewTabNavProps) {
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab')
  const tab = rawTab === 'grid' ? 'grid' : 'list'

  return (
    <nav
      className="flex gap-1 rounded-xl border bg-muted p-1"
      aria-label="View layout"
    >
      <Link
        href={`${basePath}?tab=list`}
        aria-current={tab === 'list' ? 'page' : undefined}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          tab === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-4 w-4" aria-hidden="true" />
        List
      </Link>
      <Link
        href={`${basePath}?tab=grid`}
        aria-current={tab === 'grid' ? 'page' : undefined}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          tab === 'grid'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Grid2X2 className="h-4 w-4" aria-hidden="true" />
        Grid
      </Link>
    </nav>
  )
}
