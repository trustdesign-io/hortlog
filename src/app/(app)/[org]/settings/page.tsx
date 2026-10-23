import type { Metadata } from 'next'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { OrgSettingsForm } from './org-settings-form'
import { OrgLogoCard } from './org-logo-card'
import { OrgRecordPrivacyCard } from './org-record-privacy-card'
import { OrgListingCard } from './org-listing-card'
import { OrgDwcExportCard } from './org-dwc-export-card'
import { OrgFloweringEmbedCard } from './org-flowering-embed-card'

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
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      directorLabel: true,
      managerLabel: true,
      memberLabel: true,
      postcode: true,
      recordsPublic: true,
      privateRecordsShowName: true,
      listed: true,
      personal: true,
    },
  })

  if (!org) return notFound()

  const locations = await prisma.location.findMany({
    where: { organisation: { slug: orgSlug } },
    select: { id: true, name: true, parentId: true },
  })
  const identified = await prisma.specimen.count({
    where: { organisation: { slug: orgSlug }, species: { scientificName: { not: 'Unidentified' } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Organisation settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organisation&apos;s name, URL, and role labels.
        </p>
      </div>
      <OrgLogoCard orgSlug={orgSlug} orgName={org.name} logoUrl={org.logoUrl} />
      <OrgSettingsForm org={org} orgSlug={orgSlug} />
      <OrgRecordPrivacyCard
        orgSlug={orgSlug}
        recordsPublic={org.recordsPublic}
        privateRecordsShowName={org.privateRecordsShowName}
      />
      <OrgListingCard orgSlug={orgSlug} listed={org.listed} personal={org.personal} />
      <OrgFloweringEmbedCard
        orgSlug={orgSlug}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'}
        locations={locations}
      />
      <OrgDwcExportCard orgSlug={orgSlug} plantCount={identified} />
    </div>
  )
}
