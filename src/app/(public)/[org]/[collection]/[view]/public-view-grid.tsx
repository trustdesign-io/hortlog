import Link from 'next/link'
import { ScientificName } from '@/components/ui/scientific-name'

interface GridSpecimen {
  id: string
  slug: string
  gridCell: string
  commonName: string
  scientificName: string
}

interface PublicViewGridProps {
  rows: number
  cols: number
  specimens: GridSpecimen[]
  basePath: string
}

export function PublicViewGrid({ rows, cols, specimens, basePath }: PublicViewGridProps) {
  if (rows <= 0 || cols <= 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Grid is not configured.
      </p>
    )
  }

  if (specimens.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No specimens have been placed in this grid yet.
      </p>
    )
  }

  const cellMap: Record<string, GridSpecimen> = {}
  for (const s of specimens) {
    cellMap[s.gridCell] = s
  }

  return (
    <div
      className="overflow-x-auto pb-4"
      role="region"
      aria-label="Specimen grid"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(80px, 1fr))`,
          gap: '6px',
          minWidth: `${cols * 86}px`,
        }}
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const cell = `${row},${col}`
            const specimen = cellMap[cell]

            if (specimen) {
              return (
                <Link
                  key={cell}
                  href={`${basePath}/${specimen.slug}`}
                  className="flex min-h-[80px] flex-col rounded-lg p-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: 'color-mix(in srgb, #DCE5D3 80%, transparent)' }}
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
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
