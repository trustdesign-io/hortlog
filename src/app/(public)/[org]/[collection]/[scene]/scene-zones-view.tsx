'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ScientificName } from '@/components/ui/scientific-name'
import { getZoneTilt, ZONE_TYPE_LABELS } from '@/lib/zone-types'
import type { ZoneType } from '@prisma/client'

interface ZoneSpecimen {
  id: string
  slug: string
  gridCell: string
  commonName: string
  scientificName: string
}

export interface PublicZone {
  id: string
  name: string
  type: ZoneType
  rows: number
  cols: number
  specimens: ZoneSpecimen[]
}

interface SceneZonesViewProps {
  zones: PublicZone[]
  basePath: string
}

function ZoneGrid({
  zone,
  basePath,
  perspective,
}: {
  zone: PublicZone
  basePath: string
  perspective: boolean
}) {
  const tilt = perspective ? getZoneTilt(zone.type, zone.rows) : 0
  const cellMap: Record<string, ZoneSpecimen> = {}
  for (const s of zone.specimens) cellMap[s.gridCell] = s

  return (
    <section aria-label={`${zone.name} (${ZONE_TYPE_LABELS[zone.type]})`}>
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {zone.name}
      </p>
      <div
        style={
          tilt !== 0
            ? {
                transform: `rotateX(${tilt}deg)`,
                transformOrigin: tilt > 0 ? '50% 0%' : '50% 100%',
                transformStyle: 'preserve-3d',
              }
            : undefined
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${zone.cols}, minmax(80px, 1fr))`,
            gap: '6px',
            minWidth: `${zone.cols * 86}px`,
          }}
        >
          {Array.from({ length: zone.rows }, (_, row) =>
            Array.from({ length: zone.cols }, (_, col) => {
              const cell = `${row},${col}`
              const specimen = cellMap[cell]
              if (specimen) {
                return (
                  <Link
                    key={cell}
                    href={`${basePath}/${specimen.slug}`}
                    className="flex min-h-[80px] flex-col rounded-lg p-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #DCE5D3 80%, transparent)',
                      ...(tilt !== 0
                        ? { transform: `rotateX(${-tilt}deg)`, transformStyle: 'preserve-3d' as const }
                        : {}),
                    }}
                    aria-label={`${specimen.commonName} — row ${row + 1}, column ${col + 1}`}
                  >
                    <p className="truncate text-[11px] font-medium leading-tight">
                      {specimen.commonName}
                    </p>
                    <ScientificName className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
                      {specimen.scientificName}
                    </ScientificName>
                  </Link>
                )
              }
              return (
                <div
                  key={cell}
                  className="min-h-[80px] rounded-lg bg-muted/50"
                  aria-hidden="true"
                  style={
                    tilt !== 0
                      ? { transform: `rotateX(${-tilt}deg)`, transformStyle: 'preserve-3d' as const }
                      : undefined
                  }
                />
              )
            }),
          )}
        </div>
      </div>
    </section>
  )
}

export function SceneZonesView({ zones, basePath }: SceneZonesViewProps) {
  const [perspective, setPerspective] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const hasMultipleZones = zones.length > 1
  const anyTilted = zones.some((z) => getZoneTilt(z.type, z.rows) !== 0)

  if (zones.length === 0 || zones.every((z) => z.specimens.length === 0)) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No specimens have been placed in this scene yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {anyTilted && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPerspective((v) => !v)}
            className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-pressed={perspective}
          >
            {perspective ? 'Flat view' : 'Perspective view'}
          </button>
        </div>
      )}
      <div
        className="overflow-x-auto pb-4"
        role="region"
        aria-label="Specimen grid"
      >
        <div
          style={perspective ? { perspective: '900px', perspectiveOrigin: '50% -10%' } : undefined}
        >
          {/* Zones rendered back to front (lowest position index first) */}
          <div className={hasMultipleZones ? 'flex flex-col gap-6' : undefined}>
            {zones.map((zone) => (
              <ZoneGrid key={zone.id} zone={zone} basePath={basePath} perspective={perspective} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
