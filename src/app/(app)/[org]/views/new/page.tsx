import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CreateViewForm } from './create-view-form'

interface NewViewPageProps {
  params: Promise<{ org: string }>
}

export default async function NewViewPage({ params }: NewViewPageProps) {
  const { org: orgSlug } = await params
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const collections = await prisma.collection.findMany({
    where: { organisationId: org.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href={`/${orgSlug}/views`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to views
        </Link>
        <h1 className="font-heading text-2xl font-medium">New view</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a grid display for a Vantage screen.
        </p>
      </div>
      <CreateViewForm orgSlug={orgSlug} collections={collections} />
    </div>
  )
}
