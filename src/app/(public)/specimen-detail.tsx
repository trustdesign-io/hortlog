import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { ScientificName } from '@/components/ui/scientific-name'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
}

interface SpecimenDetailProps {
  species: {
    commonName: string
    scientificName: string
    family: string | null
    origin: string | null
    description: string | null
    conservationStatus: string | null
  }
  specimen: {
    accessionNumber: string | null
    notes: string | null
    imageUrl?: string | null
  }
  breadcrumbs?: BreadcrumbItem[]
  backHref?: string
}

const IUCN_DANGER: Record<string, string> = {
  EX: 'Extinct',
  EW: 'Extinct in the Wild',
  CR: 'Critically Endangered',
  EN: 'Endangered',
  VU: 'Vulnerable',
  NT: 'Near Threatened',
  LC: 'Least Concern',
  DD: 'Data Deficient',
}

function conservationBadgeVariant(
  status: string,
): 'destructive' | 'outline' | 'secondary' | 'default' {
  const upper = status.toUpperCase()
  if (upper === 'EX' || upper === 'EW' || upper === 'CR') return 'destructive'
  if (upper === 'EN' || upper === 'VU') return 'outline'
  if (upper === 'NT' || upper === 'LC') return 'secondary'
  return 'outline'
}

export function SpecimenDetail({ species, specimen, breadcrumbs, backHref }: SpecimenDetailProps) {
  const conservationLabel = species.conservationStatus
    ? IUCN_DANGER[species.conservationStatus.toUpperCase()] ?? species.conservationStatus
    : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Back link */}
      {backHref && (
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-4')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back
        </Link>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Hero */}
      <header className="mb-6">
        {specimen.imageUrl !== undefined && (
          <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl border bg-muted sm:h-64">
            <SpecimenImage
              imageUrl={specimen.imageUrl}
              alt={species.commonName}
              fill
              priority
              sizes="(max-width: 640px) calc(100vw - 2rem), 640px"
            />
          </div>
        )}
        <ScientificName className="text-3xl font-medium leading-tight">
          {species.scientificName}
        </ScientificName>
        <h1 className="mt-1 text-xl font-medium text-foreground">{species.commonName}</h1>
        {specimen.accessionNumber && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            #{specimen.accessionNumber}
          </p>
        )}
        {conservationLabel && species.conservationStatus && (
          <div className="mt-2">
            <Badge variant={conservationBadgeVariant(species.conservationStatus)}>
              {conservationLabel}
            </Badge>
          </div>
        )}
      </header>

      {/* Details */}
      <dl className="space-y-4">
        {species.family && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Family
            </dt>
            <dd className="mt-0.5 text-sm">{species.family}</dd>
          </div>
        )}
        {species.origin && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Origin
            </dt>
            <dd className="mt-0.5 text-sm">{species.origin}</dd>
          </div>
        )}
        {species.description && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              About
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-foreground/80">
              {species.description}
            </dd>
          </div>
        )}
        {specimen.notes && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-foreground/80">
              {specimen.notes}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function specimenJsonLdString(scientificName: string, commonName: string): string {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'Taxon',
    name: scientificName,
    alternateName: commonName,
  }
  // Escape </script> sequences to prevent tag injection in inline scripts
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}
