import type { Metadata } from 'next'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { OrgSettingsForm } from './org-settings-form'
import { OrgLogoCard } from './org-logo-card'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface OrgSettingsPageProps {
  params: Promise<{ org: string }>
}

export default async function OrgSettingsPage({ params }: OrgSettingsPageProps) {
  const { org: orgSlug } = await params
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { name: true, slug: true, logoUrl: true, managerLabel: true, memberLabel: true },
  })

  if (!org) return notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Organisation settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organisation&apos;s name, URL, and role labels.
        </p>
      </div>
      <OrgLogoCard orgSlug={orgSlug} orgName={org.name} logoUrl={org.logoUrl} />
      <OrgSettingsForm org={org} orgSlug={orgSlug} />
    </div>
  )
}
