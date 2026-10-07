import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GridEditor } from './grid-editor'
import { QRPanel } from './qr-panel'

interface ViewEditPageProps {
  params: Promise<{ org: string; id: string }>
}

export default async function ViewEditPage({ params }: ViewEditPageProps) {
  const { org: orgSlug, id: viewId } = await params
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const view = await prisma.view.findUnique({
    where: { id: viewId, organisationId: org.id },
    select: {
      id: true,
      name: true,
      slug: true,
      gridRows: true,
      gridCols: true,
      shortCode: true,
      primaryCollection: { select: { name: true } },
    },
  })
  if (!view) return notFound()

  const [placedSpecimens, availableSpecimens] = await Promise.all([
    prisma.specimen.findMany({
      where: { organisationId: org.id, viewId },
      select: {
        id: true,
        gridCell: true,
        accessionNumber: true,
        species: { select: { commonName: true, scientificName: true } },
      },
    }),
    prisma.specimen.findMany({
      where: { organisationId: org.id, viewId: null },
      select: {
        id: true,
        accessionNumber: true,
        species: { select: { commonName: true, scientificName: true } },
      },
      orderBy: { species: { commonName: 'asc' } },
    }),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/views`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to views
        </Link>
        <h1 className="font-heading text-2xl font-medium">{view.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {view.gridRows}×{view.gridCols} grid
          {view.primaryCollection && ` · ${view.primaryCollection.name}`}
        </p>
      </div>
      <GridEditor
        orgSlug={orgSlug}
        viewId={view.id}
        gridRows={view.gridRows}
        gridCols={view.gridCols}
        placedSpecimens={placedSpecimens.map((s) => ({
          id: s.id,
          gridCell: s.gridCell!,
          accessionNumber: s.accessionNumber,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
        }))}
        availableSpecimens={availableSpecimens.map((s) => ({
          id: s.id,
          accessionNumber: s.accessionNumber,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
        }))}
      />
      <QRPanel
        orgSlug={orgSlug}
        viewId={view.id}
        shortCode={view.shortCode}
        siteUrl={siteUrl}
      />
    </div>
  )
}
