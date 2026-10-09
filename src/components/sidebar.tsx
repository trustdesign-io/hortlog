'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Leaf,
  Grid3x3,
  BookOpen,
  Users,
  Settings,
  LayoutDashboard,
  FlaskConical,
  Building2,
  Menu,
  ChevronDown,
  CheckSquare,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActiveHref, getOrgSlugFromPath } from '@/lib/nav-utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { UserMenu } from '@/components/user-menu'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/theme-toggle'
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
}

function buildOrgNav(orgSlug: string): NavItem[] {
  return [
    { href: `/${orgSlug}`, label: 'Overview', icon: LayoutDashboard },
    { href: `/${orgSlug}/specimens`, label: 'Specimens', icon: Leaf },
    { href: `/${orgSlug}/views`, label: 'Views', icon: Grid3x3 },
    { href: `/${orgSlug}/collections`, label: 'Collections', icon: BookOpen },
    { href: `/${orgSlug}/members`, label: 'Members', icon: Users },
    { href: `/${orgSlug}/todo`, label: 'To do', icon: CheckSquare },
    { href: `/${orgSlug}/settings`, label: 'Org Settings', icon: Settings },
  ]
}

const myRecordNav: NavItem[] = [
  { href: '/records', label: 'My record', icon: ClipboardList },
]

const accountNav: NavItem[] = [
  { href: '/settings', label: 'Account', icon: Settings },
]

const adminNav: NavItem[] = [
  { href: '/admin/organisations', label: 'Organisations', icon: Building2 },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/species', label: 'Species', icon: FlaskConical },
]

const mobileNav: NavItem[] = [...myRecordNav, ...accountNav]

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
            onClick={onNavigate}
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
      >
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 truncate text-left">
          {currentOrg?.name ?? currentSlug}
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
}

function getKnownSlugs(user: UserWithMemberships, allOrgs: OrgOption[] | undefined): string[] {
  return user.isAdmin && allOrgs
    ? allOrgs.map(o => o.slug)
    : user.memberships.map(m => m.organisation.slug)
}

function SidebarContent({ user, onNavigate, allOrgs }: SidebarContentProps) {
  const pathname = usePathname()
  const knownSlugs = getKnownSlugs(user, allOrgs)
  const orgSlug = getOrgSlugFromPath(pathname, knownSlugs)
  const orgNav = orgSlug ? buildOrgNav(orgSlug) : []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Logo href="/records" />
        <ThemeToggle />
      </div>

      {/* Org context — only when inside an org */}
      {orgSlug !== null && (
        <div className="border-b py-2">
          <OrgSwitcher user={user} currentSlug={orgSlug} allOrgs={allOrgs} />
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4">
        {/* My record — always first */}
        <NavLinks items={myRecordNav} onNavigate={onNavigate} label="Personal navigation" />

        {orgNav.length > 0 && (
          <div>
            <p className="px-6 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Organisation
            </p>
            <NavLinks items={orgNav} onNavigate={onNavigate} label="Organisation navigation" />
          </div>
        )}

        <div>
          <p className="px-6 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            Settings
          </p>
          <NavLinks items={accountNav} onNavigate={onNavigate} label="Account navigation" />
        </div>

        {user.isAdmin && (
          <div>
            <p className="px-6 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Admin
            </p>
            <NavLinks items={adminNav} onNavigate={onNavigate} label="Admin navigation" />
          </div>
        )}
      </div>

      {/* User footer */}
      <div className="border-t">
        <UserMenu user={user} />
      </div>
    </div>
  )
}

interface MobileBottomNavProps {
  user: UserWithMemberships
  allOrgs?: OrgOption[]
}

function MobileBottomNav({ user, allOrgs }: MobileBottomNavProps) {
  const pathname = usePathname()
  const knownSlugs = getKnownSlugs(user, allOrgs)
  const orgSlug = getOrgSlugFromPath(pathname, knownSlugs)

  const items: NavItem[] = orgSlug
    ? [
        { href: `/${orgSlug}`, label: 'Overview', icon: LayoutDashboard },
        { href: `/${orgSlug}/specimens`, label: 'Specimens', icon: Leaf },
        { href: `/${orgSlug}/views`, label: 'Views', icon: Grid3x3 },
        { href: `/${orgSlug}/todo`, label: 'To do', icon: CheckSquare },
        { href: '/settings', label: 'Account', icon: Settings },
      ]
    : mobileNav

  const activeHref = getActiveHref(items, pathname ?? '')

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background md:hidden"
    >
      {items.map((item) => {
        const isActive = item.href === activeHref
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className="h-5 w-5" aria-hidden={true} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({ user, allOrgs }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <SidebarContent user={user} allOrgs={allOrgs} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Logo href="/records" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent user={user} onNavigate={() => setOpen(false)} allOrgs={allOrgs} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav user={user} allOrgs={allOrgs} />
    </>
  )
}
