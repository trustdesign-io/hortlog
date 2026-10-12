'use client'

import { ScientificName } from '@/components/ui/scientific-name'
import { ZONE_TYPE_LABELS, getZoneTilt } from '@/lib/zone-types'
import type { ZoneType } from '@prisma/client'

interface PreviewSpecimen {
  id: string
  gridCell: string
  commonName: string
  scientificName: string
}

interface PreviewZone {
  id: string
  name: string
  type: ZoneType
  rows: number
  cols: number
  position: number
  specimens: PreviewSpecimen[]
}

interface PerspectivePreviewProps {
  zones: PreviewZone[]
}

function ZoneGrid({ zone }: { zone: PreviewZone }) {
  const tilt = getZoneTilt(zone.type, zone.rows)
  const cellMap: Record<string, PreviewSpecimen> = {}
  for (const s of zone.specimens) if (s.gridCell) cellMap[s.gridCell] = s

  return (
    <section aria-label={`${zone.name} zone`} className="w-full">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {zone.name}
        <span className="ml-1 opacity-60">({ZONE_TYPE_LABELS[zone.type]})</span>
      </p>
      <div
        style={{
          transform: tilt !== 0 ? `rotateX(${tilt}deg)` : undefined,
          transformOrigin: tilt > 0 ? '50% 0%' : '50% 100%',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${zone.cols}, minmax(70px, 1fr))`,
            gap: '4px',
          }}
        >
          {Array.from({ length: zone.rows }, (_, row) =>
            Array.from({ length: zone.cols }, (_, col) => {
              const cell = `${row},${col}`
              const specimen = cellMap[cell]
              if (specimen) {
                return (
                  <div
                    key={cell}
                    className="flex min-h-[80px] flex-col rounded-md p-1.5"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #DCE5D3 80%, transparent)',
                      transform: tilt !== 0 ? `rotateX(${-tilt}deg)` : undefined,
                      transformStyle: 'preserve-3d',
                    }}
                    aria-label={`${specimen.commonName} at row ${row + 1}, column ${col + 1}`}
                  >
                    <p className="truncate text-[10px] font-medium leading-tight">
                      {specimen.commonName}
                    </p>
                    <ScientificName className="mt-0.5 truncate text-[9px] leading-tight text-muted-foreground">
                      {specimen.scientificName}
                    </ScientificName>
                  </div>
                )
              }
              return (
                <div key={cell} className="min-h-[80px] rounded-md bg-muted/40" aria-hidden="true" />
              )
            }),
          )}
        </div>
      </div>
    </section>
  )
}

export function PerspectivePreview({ zones }: PerspectivePreviewProps) {
  if (zones.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No zones to preview.</p>
    )
  }

  const ordered = [...zones].sort((a, b) => a.position - b.position)

  return (
    <div
      className="overflow-x-auto rounded-xl border bg-card p-4"
      role="region"
      aria-label="Perspective preview"
    >
      <div
        style={{
          perspective: '900px',
          perspectiveOrigin: '50% -10%',
        }}
      >
        <div className="flex flex-col gap-3">
          {ordered.map((zone) => (
            <ZoneGrid key={zone.id} zone={zone} />
          ))}
        </div>
      </div>
    </div>
  )
}
