import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TeamTabsProps {
  orgSlug: string
  active: 'team' | 'members'
}

/** Tabs on the Team page. Only directors, managers and admins see them: Members is for managing access. */
export function TeamTabs({ orgSlug, active }: TeamTabsProps) {
  const tabs = [
    { key: 'team', label: 'Team', href: `/${orgSlug}/team` },
    { key: 'members', label: 'Members', href: `/${orgSlug}/team/members` },
  ] as const

  return (
    <nav aria-label="Team" className="border-b border-border">
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
