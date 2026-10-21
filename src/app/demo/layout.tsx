import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { BookOpen, CheckSquare, Grid3x3, LayoutDashboard, Leaf, MapPin, UsersRound } from 'lucide-react'
import { Logo } from '@/components/layout/logo'
import { buttonVariants } from '@/components/ui/button-variants'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Try hortlog: a garden’s scene, with its bed photo and every plant marked on it.',
  robots: { index: false, follow: false },
}

const NAV = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'To do', icon: CheckSquare },
  { label: 'Specimens', icon: Leaf },
  { label: 'Locations', icon: MapPin },
  { label: 'Collections', icon: BookOpen },
  { label: 'Scenes', icon: Grid3x3, current: true },
  { label: 'Team', icon: UsersRound },
]

/** A stand-in for the signed-in app, around the demo scene. Only Scenes works. */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
        You&rsquo;re trying hortlog. Nothing you do here is saved.
      </div>
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo href="/" />
          <Link href="/sign-up" className={cn(buttonVariants({ size: 'sm' }))}>
            Sign up
          </Link>
        </div>
        <nav aria-label="Organisation" className="mx-auto max-w-3xl">
          <p className="px-4 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-6">
            Lullingstone Castle
          </p>
          <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-5">
            {NAV.map(({ label, icon: Icon, current }) => (
              <li key={label} className="shrink-0">
                {current ? (
                  <Link
                    href="/demo"
                    aria-current="page"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-medium"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </Link>
                ) : (
                  <UnavailableAction
                    reason={`${label} isn’t part of the demo. Sign up to see it with your own garden.`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </UnavailableAction>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
