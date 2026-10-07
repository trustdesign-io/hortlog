'use client'

import { useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScientificName } from '@/components/ui/scientific-name'
import { Badge } from '@/components/ui/badge'

interface SpecimenItem {
  id: string
  slug: string
  accessionNumber: string | null
  viewId: string | null
  species: { commonName: string; scientificName: string }
  view: { name: string } | null
  collections: Array<{ collection: { id: string; name: string } }>
}

interface CollectionOption {
  id: string
  name: string
}

interface SpecimensListProps {
  orgSlug: string
  specimens: SpecimenItem[]
  collections: CollectionOption[]
  initialQuery: string
  initialCollectionId: string
  initialPlaced: boolean
}

export function SpecimensList({
  orgSlug,
  specimens,
  collections,
  initialQuery,
  initialCollectionId,
  initialPlaced,
}: SpecimensListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildParams(overrides: Record<string, string | boolean | undefined>) {
    const current: Record<string, string | boolean | undefined> = {
      q: initialQuery || undefined,
      collectionId: initialCollectionId || undefined,
      placed: initialPlaced ? 'true' : undefined,
    }
    const merged = { ...current, ...overrides }
    const params = new URLSearchParams()
    if (merged.q) params.set('q', String(merged.q))
    if (merged.collectionId) params.set('collectionId', String(merged.collectionId))
    if (merged.placed) params.set('placed', 'true')
    return params
  }

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const params = buildParams({ q: q || undefined })
        router.replace(`${pathname}${params.size ? `?${params}` : ''}`)
      }, 250)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, pathname, initialQuery, initialCollectionId, initialPlaced],
  )

  function handleCollectionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = buildParams({ collectionId: e.target.value || undefined })
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`)
  }

  function handlePlacedChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = buildParams({ placed: e.target.checked ? 'true' : undefined })
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by name or accession…"
            defaultValue={initialQuery}
            onChange={handleSearch}
            className="pl-9"
            aria-label="Search specimens"
          />
        </div>
        {collections.length > 0 && (
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={initialCollectionId}
            onChange={handleCollectionChange}
            aria-label="Filter by collection"
          >
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <label className="flex h-9 items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={initialPlaced}
            onChange={handlePlacedChange}
          />
          Placed on a view
        </label>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {specimens.length === 0 ? 'No specimens found.' : `${specimens.length} specimen${specimens.length === 1 ? '' : 's'}`}
      </p>

      {/* List */}
      {specimens.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <ul role="list">
            {specimens.map((s) => (
              <li key={s.id} className="border-b last:border-0">
                <Link
                  href={`/${orgSlug}/specimens/${s.id}/edit`}
                  className="flex items-start gap-4 px-4 py-3 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.species.commonName}</p>
                    <ScientificName className="text-xs text-muted-foreground">
                      {s.species.scientificName}
                    </ScientificName>
                    {s.accessionNumber && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        #{s.accessionNumber}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {s.view && (
                      <Badge variant="secondary" className="text-xs">
                        {s.view.name}
                      </Badge>
                    )}
                    {s.collections.map(({ collection }) => (
                      <Badge key={collection.id} variant="outline" className="text-xs">
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
