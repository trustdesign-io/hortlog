'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScientificName } from '@/components/ui/scientific-name'
import type { Species } from '@prisma/client'

interface SpeciesBrowserProps {
  species: Species[]
  orgSlug: string
  initialQuery: string
}

interface SpeciesDetailProps {
  species: Species
}

function SpeciesDetail({ species }: SpeciesDetailProps) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <h2 className="font-heading text-xl font-medium">{species.commonName}</h2>
        <ScientificName className="mt-1 text-lg text-muted-foreground">
          {species.scientificName}
        </ScientificName>
      </div>

      <dl className="divide-y text-sm">
        {species.family && (
          <div className="flex gap-4 py-3">
            <dt className="w-28 shrink-0 text-muted-foreground">Family</dt>
            <dd>{species.family}</dd>
          </div>
        )}
        {species.origin && (
          <div className="flex gap-4 py-3">
            <dt className="w-28 shrink-0 text-muted-foreground">Origin</dt>
            <dd>{species.origin}</dd>
          </div>
        )}
        {species.conservationStatus && (
          <div className="flex gap-4 py-3">
            <dt className="w-28 shrink-0 text-muted-foreground">Status</dt>
            <dd>
              <Badge variant="outline">{species.conservationStatus}</Badge>
            </dd>
          </div>
        )}
        {species.description && (
          <div className="flex flex-col gap-2 py-3">
            <dt className="text-muted-foreground">Description</dt>
            <dd className="text-sm leading-relaxed">{species.description}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function SpeciesBrowser({ species, orgSlug: _orgSlug, initialQuery }: SpeciesBrowserProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [selected, setSelected] = useState<Species | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      router.replace(`${pathname}${params.size ? `?${params}` : ''}`)
    },
    [router, pathname],
  )

  function handleRowClick(s: Species) {
    setSelected(s)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search by name, scientific name, or family…"
          defaultValue={initialQuery}
          onChange={handleSearch}
          className="pl-9"
          aria-label="Search species"
        />
      </div>

      {/* Results */}
      {species.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {initialQuery ? `No species found matching "${initialQuery}"` : 'No species in the catalogue yet.'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Need a species added?{' '}
            <a
              href="mailto:admin@trustdesign.io"
              className="text-primary underline-offset-2 hover:underline"
            >
              Contact the admin
              <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <p className="border-b px-4 py-2 text-xs text-muted-foreground">
            {species.length} {species.length === 1 ? 'species' : 'species'} found
          </p>
          <ul role="list">
            {species.map((s) => (
              <li key={s.id} className="border-b last:border-0">
                <button
                  type="button"
                  onClick={() => handleRowClick(s)}
                  className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  aria-expanded={selected?.id === s.id && sheetOpen}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{s.commonName}</p>
                    <ScientificName className="text-xs text-muted-foreground">
                      {s.scientificName}
                    </ScientificName>
                  </div>
                  <div className="shrink-0 text-right">
                    {s.family && <p className="text-xs text-muted-foreground">{s.family}</p>}
                    {s.origin && <p className="text-xs text-muted-foreground">{s.origin}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detail drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="sr-only">{selected.commonName}</SheetTitle>
                <SheetDescription className="sr-only">
                  Details for {selected.commonName} ({selected.scientificName})
                </SheetDescription>
              </SheetHeader>
              <SpeciesDetail species={selected} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
