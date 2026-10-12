import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface PageTab {
  key: string
  label: string
  href: string
}

interface PageTabsProps {
  label: string
  tabs: readonly PageTab[]
  active: string
}

/** Link tabs under a page title: each tab is its own route. */
export function PageTabs({ label, tabs, active }: PageTabsProps) {
  return (
    <nav aria-label={label} className="border-b border-border">
      <ul className="-mb-px flex gap-4">
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center border-b-2 px-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
