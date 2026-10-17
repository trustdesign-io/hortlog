'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ScientificName } from '@/components/ui/scientific-name'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { cn } from '@/lib/utils'

export interface SpottedPlant {
  number: number
  slug: string
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
  /** Where it is in the photo, 0–1 from the left and top */
  x: number
  y: number
}

interface BedPhotoViewProps {
  photoUrl: string
  plants: SpottedPlant[]
  basePath: string
  /** Shown instead if the photo can't load (e.g. offline) */
  fallback: ReactNode
}

/**
 * The bed as the visitor sees it: the photo, with a number on each plant.
 * Tapping one shows what it is, with a link to its page.
 */
export function BedPhotoView({ photoUrl, plants, basePath, fallback }: BedPhotoViewProps) {
  const [failed, setFailed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  if (failed) return <>{fallback}</>
  const plant = plants.find((p) => p.number === picked) ?? null

  return (
    <div className="space-y-3">
      <div className="relative -mx-4 overflow-hidden bg-muted sm:mx-0 sm:rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- photo behind a signed link */}
        <img
          src={photoUrl}
          alt="The bed in front of you"
          className="block h-auto w-full"
          onError={() => setFailed(true)}
        />
        {plants.map((p) => (
          <button
            key={p.number}
            type="button"
            onClick={() => setPicked((n) => (n === p.number ? null : p.number))}
            aria-pressed={picked === p.number}
            aria-label={`${p.number}: ${p.commonName}`}
            className={cn(
              'absolute flex h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 px-1.5 text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70',
              picked === p.number
                ? 'scale-110 border-white bg-primary text-primary-foreground'
                : 'border-white/90 bg-white/90 text-[#16201A]',
            )}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            {p.number}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {plant ? (
          <Link
            href={`${basePath}/${plant.slug}`}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <SpecimenImage imageUrl={plant.thumbnailUrl} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-primary">{plant.number}</span>
              <span className="block truncate font-heading text-lg leading-tight">{plant.commonName}</span>
              <ScientificName className="block truncate text-sm text-muted-foreground">{plant.scientificName}</ScientificName>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
              Discover
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        ) : plants.length === 0 ? null : (
          <p className="rounded-2xl border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">
            Tap a number on the photo to see what&rsquo;s growing there.
          </p>
        )}
      </div>
    </div>
  )
}
