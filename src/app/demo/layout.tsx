import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { DEMO_GARDEN_NAME, DEMO_ORG } from './demo-data'
import { DemoShell } from './demo-shell'

export const metadata: Metadata = {
  title: 'Demo',
  description: 'Try hortlog: a garden’s scene, with its bed photo and every plant marked on it.',
  robots: { index: false, follow: false },
}

// Read live from the database on each visit, never built ahead
export const dynamic = 'force-dynamic'

/** The demo inside the real app's sidebar and menus, signed in as a stand-in manager. */
export default async function DemoLayout({ children }: { children: ReactNode }) {
  const org = await prisma.organisation.findUnique({ where: { slug: DEMO_ORG }, select: { id: true, slug: true, name: true } })
  if (!org) return notFound()

  const now = new Date()
  const user: UserWithMemberships = {
    id: 'demo',
    email: 'demo@hortlog.com',
    name: 'Demo gardener',
    avatarUrl: null,
    isAdmin: false,
    onboardingCompletedAt: now,
    username: null,
    recordPublic: false,
    recordShowNotes: false,
    creditOnPlants: false,
    createdAt: now,
    updatedAt: now,
    memberships: [
      { id: 'demo', role: 'MANAGER', createdAt: now, userId: 'demo', organisationId: org.id, organisation: { ...org, name: DEMO_GARDEN_NAME } },
    ],
  }

  return (
    <DemoShell user={user} orgSlug={org.slug}>
      {children}
    </DemoShell>
  )
}
