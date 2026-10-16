'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Leaf,
  Grid3x3,
  BookOpen,
  Users,
  UsersRound,
  Settings,
  LayoutDashboard,
  FlaskConical,
  Building2,
  Menu,
  ChevronDown,
  CheckSquare,
  ClipboardList,
  CircleUser,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActiveHref, resolveOrgSlug } from '@/lib/nav-utils'
import { isLeader } from '@/lib/roles'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SignOutButton, UserIdentity, UserMenu } from '@/components/user-menu'
import { OfflineCard } from '@/components/offline/offline-status'
import { Logo } from '@/components/layout/logo'
import { useMobilePanels } from '@/components/layout/mobile-panels'
import type { TourPanel } from '@/components/tour/tour-steps'
import type { UserWithMemberships } from '@/lib/auth/current-user'

type OrgOption = { id: string; slug: string; name: string }

interface SidebarProps {
  user: UserWithMemberships
  allOrgs?: OrgOption[]
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  tourId?: string
}

export function buildOrgNav(orgSlug: string, canManage: boolean): NavItem[] {
  return [
    { href: `/${orgSlug}`, label: 'Overview', icon: LayoutDashboard, tourId: 'org-overview' },
    { href: `/${orgSlug}/todo`, label: 'To do', icon: CheckSquare, tourId: 'org-todo' },
    // Specimens has no tour step — it's a data-dense list page, not a concept to introduce
    { href: `/${orgSlug}/specimens`, label: 'Specimens', icon: Leaf, tourId: 'org-specimens' },
    { href: `/${orgSlug}/collections`, label: 'Collections', icon: BookOpen, tourId: 'org-collections' },
    { href: `/${orgSlug}/scenes`, label: 'Scenes', icon: Grid3x3, tourId: 'org-scenes' },
    { href: `/${orgSlug}/team`, label: 'Team', icon: UsersRound, tourId: 'org-team' },
    // Manager-only pages: members would only hit the no-access page
    ...(canManage
      ? [
          { href: `/${orgSlug}/settings`, label: 'Org Settings', icon: Settings, tourId: 'org-settings' },
        ]
      : []),
  ]
}

/** Platform admins and the organisation's managers can manage it. */
function canManageOrg(user: UserWithMemberships, orgSlug: string): boolean {
  if (user.isAdmin) return true
  return user.memberships.some((m) => m.organisation.slug === orgSlug && isLeader(m.role))
}

/** Everything about the signed-in person, grouped at the foot of the sidebar. */
export const youNav: NavItem[] = [
  { href: '/records', label: 'My record', icon: ClipboardList, tourId: 'my-record' },
  { href: '/settings', label: 'Account', icon: Settings, tourId: 'account-settings' },
]

const adminNav: NavItem[] = [
  { href: '/admin/organisations', label: 'Organisations', icon: Building2 },
  { href: '/admin/members', label: 'All users', icon: Users },
  { href: '/admin/species', label: 'Species', icon: FlaskConical },
]

interface NavLinksProps {
  items: NavItem[]
  onNavigate?: () => void
  label?: string
}

function NavLinks({ items, onNavigate, label }: NavLinksProps) {
  const pathname = usePathname()
  const activeHref = getActiveHref(items, pathname ?? '')

  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label={label ?? 'Navigation'}>
      {items.map((item) => {
        const isActive = item.href === activeHref
        return (
          <Link
            key={item.href}
            href={item.href}
            // Every page here is dynamic; prefetching them all at once on each load
            // fired a burst of server calls that crowded out form submissions.
            prefetch={false}
            onClick={onNavigate}
            {...(item.tourId ? { 'data-tour': item.tourId } : {})}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden={true} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

const ROLE_DISPLAY: Record<string, string> = {
  DIRECTOR: 'Director',
  MANAGER: 'Manager',
  MEMBER: 'Member',
}

interface OrgSwitcherProps {
  user: UserWithMemberships
  currentSlug: string
  allOrgs?: OrgOption[]
}

function OrgSwitcher({ user, currentSlug, allOrgs }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isAdmin = user.isAdmin && allOrgs !== undefined
  const orgsToShow: OrgOption[] = isAdmin
    ? allOrgs
    : user.memberships.map(m => m.organisation)

  const currentOrg = orgsToShow.find(o => o.slug === currentSlug)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative px-3 py-2" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="org-switcher-listbox"
        data-tour="org-switcher"
      >
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 truncate text-left">
          {currentOrg?.name ?? 'Select organisation'}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <ul
          id="org-switcher-listbox"
          role="listbox"
          aria-label="Organisations"
          className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border bg-popover shadow-md py-1"
        >
          {orgsToShow.map(org => {
            const membership = user.memberships.find(m => m.organisation.slug === org.slug)
            const roleLabel = membership
              ? ROLE_DISPLAY[membership.role] ?? membership.role
              : isAdmin ? 'Admin access' : null
            return (
              <li key={org.id} role="option" aria-selected={org.slug === currentSlug}>
                <Link
                  href={`/${org.slug}`}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                    org.slug === currentSlug ? 'text-primary font-medium' : 'text-foreground'
                  )}
                >
                  <span className="truncate">{org.name}</span>
                  {roleLabel && (
                    <span className="shrink-0 text-xs text-muted-foreground">{roleLabel}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

interface SidebarContentProps {
  user: UserWithMemberships
  onNavigate?: () => void
  allOrgs?: OrgOption[]
  /** Mobile splits the You section into its own panel. */
  includeYou?: boolean
}

function getKnownSlugs(user: UserWithMemberships, allOrgs: OrgOption[] | undefined): string[] {
  return user.isAdmin && allOrgs
    ? allOrgs.map(o => o.slug)
    : user.memberships.map(m => m.organisation.slug)
}

function SidebarContent({ user, onNavigate, allOrgs, includeYou = true }: SidebarContentProps) {
  const pathname = usePathname()
  const knownSlugs = getKnownSlugs(user, allOrgs)
  const orgSlug = resolveOrgSlug(pathname, knownSlugs, user.memberships.map((m) => m.organisation.slug))
  const orgNav = orgSlug ? buildOrgNav(orgSlug, canManageOrg(user, orgSlug)) : []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Logo href="/records" />
      </div>

      {/* Organisation: the switcher heads the section, its pages sit under it */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-3">
        {orgSlug !== null && (
          <div>
            <OrgSwitcher user={user} currentSlug={orgSlug} allOrgs={allOrgs} />
            <NavLinks items={orgNav} onNavigate={onNavigate} label="Organisation navigation" />
          </div>
        )}

        {user.isAdmin && (
          <div data-tour="admin" className={orgSlug === null ? 'pt-3' : undefined}>
            <p className="px-6 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Admin
            </p>
            <NavLinks items={adminNav} onNavigate={onNavigate} label="Admin navigation" />
          </div>
        )}
      </div>

      {includeYou && (
        <div className="border-t pt-3">
          <YouSection user={user} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  )
}

interface YouSectionProps {
  user: UserWithMemberships
  onNavigate?: () => void
}

/** Your record and account, then who's signed in. */
function YouSection({ user, onNavigate }: YouSectionProps) {
  return (
    <>
      <p className="px-6 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
        You
      </p>
      <NavLinks items={youNav} onNavigate={onNavigate} label="Your navigation" />
      {/* Offline copy: when it was saved, or that the app is offline */}
      <OfflineCard className="mx-3 mt-3" />
      {/* Same height as the desktop site footer, so the two read as one bar */}
      <div className="mt-2 flex h-16 items-center border-t">
        <div className="w-full">
          <UserMenu user={user} />
        </div>
      </div>
    </>
  )
}

/** Mobile You panel: who you are at the top, your links in the middle, sign out at the foot. */
function YouPanel({ user, onNavigate }: YouSectionProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b pb-5 pt-12">
        <UserIdentity user={user} />
        <OfflineCard className="mx-4 mt-5" />
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <NavLinks items={youNav} onNavigate={onNavigate} label="Your navigation" />
      </div>
      <div className="border-t p-3">
        <SignOutButton variant="outline" size="lg" className="w-full" />
      </div>
    </div>
  )
}

export function Sidebar({ user, allOrgs }: SidebarProps) {
  // Mobile has two slide-out panels: the menu (left) and You (right). At most one is open.
  const { panel, setPanel } = useMobilePanels()
  const close = () => setPanel(null)
  const panelProps = (which: TourPanel) => ({
    open: panel === which,
    onOpenChange: (open: boolean) => setPanel(open ? which : null),
  })

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <SidebarContent user={user} allOrgs={allOrgs} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-[var(--utility-h)] z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Logo href="/records" />
        <div className="flex items-center gap-1">
          <Sheet {...panelProps('you')}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open your menu" />}>
              <CircleUser className="h-5 w-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">You</SheetTitle>
              <YouPanel user={user} onNavigate={close} />
            </SheetContent>
          </Sheet>
          <Sheet {...panelProps('nav')}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation" />}>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent user={user} onNavigate={close} allOrgs={allOrgs} includeYou={false} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
