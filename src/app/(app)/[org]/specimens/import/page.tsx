import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { ImportWizard } from './import-wizard'

export const metadata: Metadata = { title: 'Import specimens' }

interface ImportPageProps {
  params: Promise<{ org: string }>
}

/** Bring a garden's accessions in from its records system, a spreadsheet or Darwin Core. */
export default async function ImportSpecimensPage({ params }: ImportPageProps) {
  const { org: orgSlug } = await params
  await requireOrgAccess(orgSlug, 'can_edit_specimen')
  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { name: true } })
  if (!org) return notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/${orgSlug}/specimens`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}>
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to specimens
        </Link>
        <h1 className="font-heading text-2xl font-medium">Import specimens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your accessions in from your records system, so hortlog works alongside it rather than instead of it.
          Plants already here are matched by accession number and updated.
        </p>
      </div>
      <ImportWizard orgSlug={orgSlug} gardenName={org.name} />
    </div>
  )
}
