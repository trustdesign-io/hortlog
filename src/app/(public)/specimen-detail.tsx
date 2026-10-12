import type React from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { ScientificName } from '@/components/ui/scientific-name'
import { licenceUrl } from '@/lib/personal-record'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { InTheWild } from '@/components/species/in-the-wild'
import { buildHabitatLine } from '@/lib/open-data/powo'

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
    /** iNaturalist reference photo, shown when the specimen has no photo of its own */
    photoUrl?: string | null
    photoAttribution?: string | null
    photoLicence?: string | null
    photoSourceUrl?: string | null
    // Open-data fields
    statusCategory?: string | null
    statusSource?: string | null
    statusUpdatedAt?: Date | null
    nativeRegions?: string[]
    introducedRegions?: string[]
    lifeForm?: string | null
    climate?: string | null
    habitatExcerpt?: string | null
    habitatExcerptSource?: string | null
    gbifTaxonKey?: number | null
  }
  specimen: {
    accessionNumber: string | null
    notes: string | null
    imageUrl?: string | null
    cultivar?: string | null
  }
  breadcrumbs?: BreadcrumbItem[]
  backHref?: string
  children?: React.ReactNode
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

export function SpecimenDetail({ species, specimen, breadcrumbs, backHref, children }: SpecimenDetailProps) {
  // Prefer the automatic statusCategory; fall back to the legacy manual code
  const conservationLabel =
    species.statusCategory ??
    (species.conservationStatus
      ? (IUCN_DANGER[species.conservationStatus.toUpperCase()] ?? species.conservationStatus)
      : null)
  const conservationBadgeStatus = species.statusCategory
    ? null // badge rendered by InTheWild instead
    : species.conservationStatus

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
          <figure className="mb-4">
            <div className="relative h-48 w-full overflow-hidden rounded-xl border bg-muted sm:h-64">
              <SpecimenImage
                imageUrl={specimen.imageUrl ?? species.photoUrl}
                alt={species.commonName}
                fill
                priority
                sizes="(max-width: 640px) calc(100vw - 2rem), 640px"
              />
            </div>
            {/* Credit the reference photo; it shows the species, not this plant */}
            {!specimen.imageUrl && species.photoUrl && (
              <figcaption className="mt-1.5 text-xs leading-snug text-muted-foreground">
                Reference photo of the species · {species.photoAttribution}
                {species.photoLicence && (
                  <>
                    {' · '}
                    {licenceUrl(species.photoLicence) ? (
                      <a
                        href={licenceUrl(species.photoLicence) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer license"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        {species.photoLicence}
                      </a>
                    ) : (
                      species.photoLicence
                    )}
                  </>
                )}
                {species.photoSourceUrl && (
                  <>
                    {' · via '}
                    <a
                      href={species.photoSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      iNaturalist
                    </a>
                  </>
                )}
              </figcaption>
            )}
          </figure>
        )}
        <ScientificName className="text-3xl font-medium leading-tight">
          {species.scientificName}
        </ScientificName>
        {specimen.cultivar && (
          <span className="font-heading text-3xl font-medium leading-tight"> ‘{specimen.cultivar}’</span>
        )}
        <h1 className="mt-1 text-xl font-medium text-foreground">{species.commonName}</h1>
        {specimen.accessionNumber && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            #{specimen.accessionNumber}
          </p>
        )}
        {/* Legacy badge — only shown when there's no automatic statusCategory yet */}
        {conservationLabel && conservationBadgeStatus && (
          <div className="mt-2">
            <Badge variant={conservationBadgeVariant(conservationBadgeStatus)}>
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

      <InTheWild
        statusCategory={species.statusCategory ?? null}
        statusSource={species.statusSource ?? null}
        statusUpdatedAt={species.statusUpdatedAt ?? null}
        nativeRegions={species.nativeRegions ?? []}
        introducedRegions={species.introducedRegions ?? []}
        lifeForm={species.lifeForm ?? null}
        climate={species.climate ?? null}
        habitatLine={
          species.lifeForm || species.climate || (species.nativeRegions ?? []).length
            ? buildHabitatLine({
                nativeRegions: species.nativeRegions ?? [],
                introducedRegions: species.introducedRegions ?? [],
                lifeForm: species.lifeForm ?? null,
                climate: species.climate ?? null,
              })
            : null
        }
        habitatExcerpt={species.habitatExcerpt ?? null}
        habitatExcerptSource={species.habitatExcerptSource ?? null}
        gbifTaxonKey={species.gbifTaxonKey ?? null}
      />

      {children}
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
