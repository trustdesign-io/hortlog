import Link from 'next/link'
import { HexGrid, HexOutline } from '@/components/hex-grid'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { hexCellStyle } from '@/lib/hex-grid'

const CELL_WIDTH = '6rem'

interface GridSpecimen {
  id: string
  slug: string
  gridCell: string
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
}

interface PublicSceneGridProps {
  rows: number
  cols: number
  specimens: GridSpecimen[]
  basePath: string
}

export function PublicSceneGrid({ rows, cols, specimens, basePath }: PublicSceneGridProps) {
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
      <HexGrid
        rows={rows}
        cols={cols}
        cellWidth={CELL_WIDTH}
        renderCell={(row, col) => {
          const cell = `${row},${col}`
          const specimen = cellMap[cell]

          if (specimen) {
            return (
              <Link
                key={cell}
                href={`${basePath}/${specimen.slug}`}
                className="hex-cell group"
                style={hexCellStyle(row, col)}
                aria-label={`${specimen.commonName} — row ${row + 1}, column ${col + 1}`}
                title={`${specimen.commonName} (${specimen.scientificName})`}
              >
                <span className="hex-shape block bg-muted group-hover:opacity-80">
                  <SpecimenImage
                    imageUrl={specimen.thumbnailUrl}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-[22%] block truncate bg-black/65 px-3 py-0.5 text-center text-[10px] font-medium leading-tight text-white">
                    {specimen.commonName}
                  </span>
                </span>
              </Link>
            )
          }

          return (
            <div
              key={cell}
              className="hex-cell"
              style={hexCellStyle(row, col)}
              aria-hidden="true"
            >
              <span className="hex-shape block bg-muted/50">
                <HexOutline className="text-border/60" />
              </span>
            </div>
          )
        }}
      />
    </div>
  )
}
