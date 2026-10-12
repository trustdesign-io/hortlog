export const MIN_GRID = 1
export const MAX_GRID = 20

export type GridSide = 'top' | 'bottom' | 'left' | 'right'

export const GRID_SIDES: readonly GridSide[] = ['top', 'bottom', 'left', 'right']

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

export interface GridShape {
  rows: number
  cols: number
  rowShift: number
}

export type GridResizePlan =
  | { ok: true; shape: GridShape; moveCell: (cell: string) => string }
  | { ok: false; reason: 'limits' }
  | { ok: false; reason: 'occupied'; blocked: string[] }

/**
 * Adds or removes one row or column on the given side. Everything already
 * placed keeps its place on the ground: changes at the top or left renumber
 * the cells, and a change at the top flips `rowShift` so each row keeps its
 * half-cell offset. Only an empty row or column can be removed.
 */
export function planGridResize(
  shape: GridShape,
  side: GridSide,
  delta: 1 | -1,
  cells: Array<string | null>,
): GridResizePlan {
  const isRow = side === 'top' || side === 'bottom'
  const rows = isRow ? shape.rows + delta : shape.rows
  const cols = isRow ? shape.cols : shape.cols + delta
  if (!withinLimits(rows) || !withinLimits(cols)) return { ok: false, reason: 'limits' }

  if (delta === -1) {
    const lost = { top: 0, bottom: shape.rows - 1, left: 0, right: shape.cols - 1 }[side]
    const blocked = cells.filter((c): c is string => {
      const rc = parseCell(c)
      return rc !== null && rc[isRow ? 0 : 1] === lost
    })
    if (blocked.length > 0) return { ok: false, reason: 'occupied', blocked }
  }

  const leading = side === 'top' || side === 'left'
  const dRow = side === 'top' ? delta : 0
  const dCol = side === 'left' ? delta : 0
  const rowShift = side === 'top' ? (shape.rowShift + 1) % 2 : shape.rowShift
  const moveCell = (cell: string): string => {
    const rc = parseCell(cell)
    if (!rc || !leading) return cell
    return `${rc[0] + dRow},${rc[1] + dCol}`
  }
  return { ok: true, shape: { rows, cols, rowShift }, moveCell }
}

export interface GridOp {
  side: GridSide
  delta: 1 | -1
}

export const MAX_GRID_OPS = 40

export type GridOpsPlan =
  | { ok: true; shape: GridShape; moveCell: (cell: string) => string | null }
  | { ok: false; reason: 'limits'; side: GridSide }
  | { ok: false; reason: 'occupied'; side: GridSide; blocked: string[] }

/**
 * Several resizes in a row, as one plan. `moveCell` follows a cell through
 * every step and returns null for a cell whose row or column was removed.
 */
export function planGridOps(shape: GridShape, ops: GridOp[], cells: Array<string | null>): GridOpsPlan {
  let current = shape
  let occupied = cells.filter((c): c is string => parseCell(c) !== null)
  const steps: Array<{ shape: GridShape; moveCell: (cell: string) => string }> = []
  for (const op of ops) {
    const plan = planGridResize(current, op.side, op.delta, occupied)
    if (!plan.ok) return { ...plan, side: op.side }
    steps.push(plan)
    occupied = occupied.map(plan.moveCell)
    current = plan.shape
  }
  const moveCell = (cell: string): string | null => {
    let at = cell
    for (const step of steps) {
      at = step.moveCell(at)
      const rc = parseCell(at)
      if (!rc || rc[0] < 0 || rc[1] < 0 || rc[0] >= step.shape.rows || rc[1] >= step.shape.cols) return null
    }
    return at
  }
  return { ok: true, shape: current, moveCell }
}

const SIDE_NAMES: Record<GridSide, string> = {
  top: 'top row',
  bottom: 'bottom row',
  left: 'left column',
  right: 'right column',
}

/** User-facing reason a resize can't be done. */
export function gridResizeError(plan: Extract<GridOpsPlan, { ok: false }>): string {
  if (plan.reason === 'limits') return `Grids can have ${MIN_GRID} to ${MAX_GRID} rows and columns.`
  const n = plan.blocked.length
  return `Move or remove the ${n} plant${n === 1 ? '' : 's'} in the ${SIDE_NAMES[plan.side]} first.`
}
