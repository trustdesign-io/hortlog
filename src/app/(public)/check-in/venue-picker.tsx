'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { fuzzyScore } from '@/lib/fuzzy'

interface Venue {
  slug: string
  name: string
  scenes: number
}

/** Search the venues by name and pick one. */
export function VenuePicker({ venues }: { venues: Venue[] }) {
  const [q, setQ] = useState('')
  const shown = q.trim()
    ? venues
        .map((v) => ({ v, score: fuzzyScore(q, [v.name, v.slug]) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.v)
    : venues

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search gardens"
          aria-label="Search gardens"
          className="h-11 pl-9 text-base"
        />
      </div>
      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No gardens match.</p>
      ) : (
        <ul role="list" className="divide-y overflow-hidden rounded-xl border bg-card">
          {shown.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/check-in/${v.slug}`}
                className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{v.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {v.scenes} scene{v.scenes === 1 ? '' : 's'}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
