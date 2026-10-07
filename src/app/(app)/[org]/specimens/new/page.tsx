import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AddSpecimenForm } from './add-specimen-form'

interface NewSpecimenPageProps {
  params: Promise<{ org: string }>
}

export default async function NewSpecimenPage({ params }: NewSpecimenPageProps) {
  const { org: orgSlug } = await params
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const [allSpecies, collections] = await Promise.all([
    prisma.species.findMany({
      select: { id: true, commonName: true, scientificName: true },
      orderBy: { commonName: 'asc' },
    }),
    prisma.collection.findMany({
      where: { organisationId: org.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

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
        <h1 className="font-heading text-2xl font-medium">Add specimen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record a new plant specimen for this organisation.
        </p>
      </div>
      <AddSpecimenForm
        orgSlug={orgSlug}
        species={allSpecies}
        collections={collections}
      />
    </div>
  )
}
