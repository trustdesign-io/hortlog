import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface InTheWildProps {
  speciesName: string
  statusCategory: string | null
  statusSource: string | null
  statusUpdatedAt: Date | null
  nativeRegions: string[]
  introducedRegions: string[]
  lifeForm: string | null
  climate: string | null
  habitatLine: string | null
  habitatExcerpt: string | null
  habitatExcerptSource: string | null
  gbifTaxonKey: number | null
}

function conservationVariant(
  category: string,
): 'destructive' | 'outline' | 'secondary' | 'default' {
  if (['Extinct', 'Extinct in the Wild', 'Critically Endangered'].includes(category)) return 'destructive'
  if (['Endangered', 'Vulnerable'].includes(category)) return 'outline'
  if (['Near Threatened', 'Least Concern'].includes(category)) return 'secondary'
  return 'outline'
}

export function InTheWild({
  speciesName,
  statusCategory,
  statusSource,
  statusUpdatedAt,
  nativeRegions,
  introducedRegions,
  lifeForm,
  climate,
  habitatLine,
  habitatExcerpt,
  habitatExcerptSource,
  gbifTaxonKey,
}: InTheWildProps) {
  const hasAny =
    statusCategory ||
    nativeRegions.length ||
    introducedRegions.length ||
    lifeForm ||
    climate ||
    habitatExcerpt ||
    gbifTaxonKey

  if (!hasAny) return null

  const statusDate = statusUpdatedAt
    ? new Date(statusUpdatedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null

  return (
    <section aria-labelledby="in-the-wild-heading" className="mt-6 border-t pt-6">
      <h2
        id="in-the-wild-heading"
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        In the wild
      </h2>

      <dl className="mt-3 space-y-4">
        {statusCategory && (
          <div>
            <dt className="sr-only">Conservation status</dt>
            <dd className="flex flex-wrap items-baseline gap-2">
              <Badge variant={conservationVariant(statusCategory)}>{statusCategory}</Badge>
              {(statusSource || statusDate) && (
                <span className="text-xs text-muted-foreground">
                  {statusSource}
                  {statusDate ? ` · checked ${statusDate}` : ''}
                </span>
              )}
            </dd>
          </div>
        )}

        {habitatLine && (
          <div>
            <dt className="sr-only">Habitat summary</dt>
            <dd className="text-sm text-foreground/80">{habitatLine}</dd>
          </div>
        )}

        {nativeRegions.length > 0 && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Native range
            </dt>
            <dd className="mt-0.5 text-sm">
              {nativeRegions.join(', ')}
            </dd>
          </div>
        )}

        {introducedRegions.length > 0 && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Introduced to
            </dt>
            <dd className="mt-0.5 text-sm">
              {introducedRegions.join(', ')}
            </dd>
          </div>
        )}

        {habitatExcerpt && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              About this species
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-foreground/80">
              {habitatExcerpt}
              {habitatExcerptSource && (
                <>
                  {' '}
                  <a
                    href={habitatExcerptSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                  >
                    Read more on Wikipedia
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </>
              )}
            </dd>
          </div>
        )}

        {gbifTaxonKey && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Wild records
            </dt>
            <dd className="mt-1">
              <a
                href={`https://www.gbif.org/species/${gbifTaxonKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
                aria-label="View wild occurrence records on GBIF"
              >
                <div className="relative h-32 w-full overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- GBIF tile API has no Next.js Image equivalent */}
                  <img
                    src={`https://api.gbif.org/v2/map/occurrence/density/0/0/0@1x.png?taxonKey=${gbifTaxonKey}&style=classic-noborder.poly&bin=square`}
                    alt={`Wild occurrence map for ${speciesName} (GBIF)`}
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    loading="lazy"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  CC0 and CC BY records · GBIF
                  <ExternalLink className="ml-0.5 inline h-3 w-3" aria-hidden="true" />
                </p>
              </a>
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
