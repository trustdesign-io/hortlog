import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { GridEditor } from './grid-editor'
import { QRPanel } from './qr-panel'
import { GridSizeControls } from './grid-size-controls'

interface SceneEditPageProps {
  params: Promise<{ org: string; id: string }>
}

export default async function SceneEditPage({ params }: SceneEditPageProps) {
  const { org: orgSlug, id: sceneId } = await params
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const scene = await prisma.scene.findUnique({
    where: { id: sceneId, organisationId: org.id },
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
  if (!scene) return notFound()

  const [placedSpecimens, availableSpecimens] = await Promise.all([
    prisma.specimen.findMany({
      where: { organisationId: org.id, sceneId },
      select: {
        id: true,
        gridCell: true,
        accessionNumber: true,
        imageUrl: true,
        species: { select: { commonName: true, scientificName: true, photoUrl: true } },
      },
    }),
    prisma.specimen.findMany({
      where: { organisationId: org.id, sceneId: null },
      select: {
        id: true,
        accessionNumber: true,
        imageUrl: true,
        species: { select: { commonName: true, scientificName: true, photoUrl: true } },
      },
      orderBy: { species: { commonName: 'asc' } },
    }),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/scenes`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to scenes
        </Link>
        <h1 className="font-heading text-2xl font-medium">{scene.name}</h1>
        {scene.primaryCollection && (
          <p className="mt-1 text-sm text-muted-foreground">{scene.primaryCollection.name}</p>
        )}
      </div>
      <GridSizeControls orgSlug={orgSlug} sceneId={scene.id} rows={scene.gridRows} cols={scene.gridCols} />
      <GridEditor
        orgSlug={orgSlug}
        sceneId={scene.id}
        gridRows={scene.gridRows}
        gridCols={scene.gridCols}
        placedSpecimens={placedSpecimens.map((s) => ({
          id: s.id,
          gridCell: s.gridCell!,
          accessionNumber: s.accessionNumber,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
          thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
        }))}
        availableSpecimens={availableSpecimens.map((s) => ({
          id: s.id,
          accessionNumber: s.accessionNumber,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
          thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
        }))}
      />
      <QRPanel
        orgSlug={orgSlug}
        sceneId={scene.id}
        sceneName={scene.name}
        sceneSlug={scene.slug}
        shortCode={scene.shortCode}
        siteUrl={siteUrl}
      />
    </div>
  )
}
