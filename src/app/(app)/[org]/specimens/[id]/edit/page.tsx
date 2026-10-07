import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SpecimenEditForm } from './specimen-edit-form'
import { SpecimenImageCard } from './specimen-image-card'

interface EditSpecimenPageProps {
  params: Promise<{ org: string; id: string }>
}

export default async function EditSpecimenPage({ params }: EditSpecimenPageProps) {
  const { org: orgSlug, id: specimenId } = await params
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const [specimen, collections] = await Promise.all([
    prisma.specimen.findUnique({
      where: { id: specimenId, organisationId: org.id },
      select: {
        id: true,
        slug: true,
        accessionNumber: true,
        notes: true,
        imageUrl: true,
        latitude: true,
        longitude: true,
        viewId: true,
        gridCell: true,
        species: { select: { id: true, commonName: true, scientificName: true } },
        view: { select: { id: true, name: true } },
        collections: { select: { collectionId: true } },
      },
    }),
    prisma.collection.findMany({
      where: { organisationId: org.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!specimen) return notFound()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/specimens`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to specimens
        </Link>
        <h1 className="font-heading text-2xl font-medium">Edit specimen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {specimen.species.commonName} —{' '}
          <span lang="la" className="italic">{specimen.species.scientificName}</span>
        </p>
      </div>
      <SpecimenImageCard
        orgSlug={orgSlug}
        specimenId={specimen.id}
        commonName={specimen.species.commonName}
        imageUrl={specimen.imageUrl}
      />
      <SpecimenEditForm
        orgSlug={orgSlug}
        specimen={{
          id: specimen.id,
          slug: specimen.slug,
          accessionNumber: specimen.accessionNumber,
          notes: specimen.notes,
          latitude: specimen.latitude,
          longitude: specimen.longitude,
          viewId: specimen.viewId,
          gridCell: specimen.gridCell,
          species: specimen.species,
          view: specimen.view,
          collectionIds: specimen.collections.map((c) => c.collectionId),
        }}
        collections={collections}
      />
    </div>
  )
}
