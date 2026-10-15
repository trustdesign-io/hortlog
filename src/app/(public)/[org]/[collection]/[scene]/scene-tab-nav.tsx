'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { List, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SceneTabNavProps {
  basePath: string
}

export function SceneTabNav({ basePath }: SceneTabNavProps) {
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab')
  const tab = rawTab === 'layout' || rawTab === 'grid' ? 'layout' : 'list'

  return (
    <nav
      className="flex gap-1 rounded-xl border bg-muted p-1"
      aria-label="Scene layout"
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
        href={`${basePath}?tab=layout`}
        aria-current={tab === 'layout' ? 'page' : undefined}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          tab === 'layout'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Hexagon className="h-4 w-4" aria-hidden="true" />
        Layout
      </Link>
    </nav>
  )
}
