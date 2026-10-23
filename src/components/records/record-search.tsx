'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { fuzzyScore } from '@/lib/fuzzy'

export interface SearchableRecord {
  id: string
  /** What the search looks in: names, family, site, record number, date… */
  fields: Array<string | null | undefined>
  /** The record as listed */
  node: ReactNode
}

interface RecordSearchProps {
  records: SearchableRecord[]
}

/** The record list with a forgiving search above it: typos, any word order, initials. */
export function RecordSearch({ records }: RecordSearchProps) {
  const [query, setQuery] = useState('')

  const shown = useMemo(() => {
    if (!query.trim()) return records
    return records
      .map((r, i) => ({ r, i, score: fuzzyScore(query, r.fields) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map((x) => x.r)
  }, [query, records])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plants, families, sites, dates…"
          aria-label="Search the record"
          className="h-11 pl-9 text-base sm:text-sm"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {query.trim() && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {shown.length === 0
            ? 'No records match.'
            : `${shown.length} of ${records.length} record${records.length === 1 ? '' : 's'}`}
        </p>
      )}
      {shown.length > 0 && (
        <ol className="space-y-2" aria-label="Work records">
          {shown.map((r) => (
            <li key={r.id}>{r.node}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
