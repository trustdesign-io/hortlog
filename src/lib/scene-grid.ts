export const MIN_GRID = 1
export const MAX_GRID = 20

export type GridEdge = 'row' | 'col'

/** "row,col" → [row, col], or null for anything malformed. */
export function parseCell(cell: string | null): [number, number] | null {
  const m = cell ? /^(\d+),(\d+)$/.exec(cell) : null
  return m ? [Number(m[1]), Number(m[2])] : null
}

/**
 * Plants that would fall outside a grid of `rows` × `cols`. Shrinking is only
 * allowed when this is empty, so nothing is taken off the grid by accident.
 */
export function cellsOutside(cells: Array<string | null>, rows: number, cols: number): string[] {
  return cells.filter((c): c is string => {
    const rc = parseCell(c)
    return rc !== null && (rc[0] >= rows || rc[1] >= cols)
  })
}

export function withinLimits(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_GRID && n <= MAX_GRID
}
