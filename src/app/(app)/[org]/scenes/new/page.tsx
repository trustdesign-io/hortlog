import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { CreateSceneForm } from './create-scene-form'

interface NewScenePageProps {
  params: Promise<{ org: string }>
}

export default async function NewScenePage({ params }: NewScenePageProps) {
  const { org: orgSlug } = await params
  await requireOrgAccess(orgSlug, 'can_edit_scene')

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
          href={`/${orgSlug}/scenes`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to scenes
        </Link>
        <h1 className="font-heading text-2xl font-medium">New scene</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a grid display for a Vantage screen.
        </p>
      </div>
      <CreateSceneForm orgSlug={orgSlug} collections={collections} />
    </div>
  )
}
