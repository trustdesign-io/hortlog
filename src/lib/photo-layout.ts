import { cellKey, hexOf, withinLimits, MAX_GRID, MIN_GRID, parseGridCell } from '@/lib/scene-grid'

/**
 * Checks a layout worked out from a bed photo (by Claude, via /api/claude)
 * against the scene as it is, and plans the change. Pure, so it's testable.
 */
export interface PhotoLayoutInput {
  rows: number
  cols: number
  /** 0 or 1: which rows are offset half a cell (see Scene.rowShift) */
  rowShift?: number
  /** Hexes ("row,col") outside the bed */
  blockedCells?: string[]
  /** Plants seen in the photo: a hex "row,col", or a small cell "row,col:k" (0–6) */
  plants?: { cell: string; name: string; note?: string; cells?: string[]; photo?: [number, number] }[]
}

export interface PlacedPlant {
  id: string
  cell: string
  name: string
  /** More hexes a big plant covers */
  extraCells?: string[]
}

export interface PlannedLayout {
  rows: number
  cols: number
  rowShift: number
  blockedCells: string[]
  splitCells: string[]
  plants: {
    row: number
    col: number
    sub: number | null
    name: string
    note: string | null
    /** More whole hexes it covers */
    extraCells: string[]
    /** Where it is on the photo, 0–1 from left and top */
    photo: [number, number] | null
  }[]
}

export const MAX_PHOTO_PLANTS = 200
const MAX_NAME = 120
const MAX_NOTE = 500

export function planPhotoLayout(
  scene: { splitCells: string[] },
  existing: PlacedPlant[],
  input: unknown,
): { ok: true; plan: PlannedLayout } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const body = (input ?? {}) as Partial<PhotoLayoutInput>
  const rows = Number(body.rows)
  const cols = Number(body.cols)
  if (!withinLimits(rows) || !withinLimits(cols)) {
    return { ok: false, errors: [`rows and cols must be whole numbers from ${MIN_GRID} to ${MAX_GRID}.`] }
  }
  const rowShift = body.rowShift === 1 ? 1 : 0
  if (body.rowShift !== undefined && body.rowShift !== 0 && body.rowShift !== 1) errors.push('rowShift must be 0 or 1.')

  const inGrid = (r: number, c: number) => r < rows && c < cols
  const blocked = new Set<string>()
  for (const b of Array.isArray(body.blockedCells) ? body.blockedCells : []) {
    const p = parseGridCell(String(b))
    if (!p || p.sub !== null || !inGrid(p.row, p.col)) errors.push(`blockedCells: "${b}" isn't a hex in the grid ("row,col", from 0).`)
    else blocked.add(cellKey(p.row, p.col))
  }

  // Plants already placed must stay inside the bed
  const used = new Set<string>()
  const split = new Set(scene.splitCells)
  for (const e of existing) {
    const p = parseGridCell(e.cell)
    if (!p) continue
    const hex = cellKey(p.row, p.col)
    if (!inGrid(p.row, p.col)) errors.push(`${e.name} is at ${e.cell}, outside a ${rows} × ${cols} grid. Keep the grid big enough, or move it in hortlog first.`)
    else if (blocked.has(hex)) errors.push(`${e.name} is at ${e.cell}, which you've marked outside the bed.`)
    used.add(e.cell)
    for (const x of e.extraCells ?? []) used.add(x)
  }

  const plants: PlannedLayout['plants'] = []
  const raw = Array.isArray(body.plants) ? body.plants : []
  if (raw.length > MAX_PHOTO_PLANTS) errors.push(`At most ${MAX_PHOTO_PLANTS} plants at once.`)
  for (const [i, pl] of raw.slice(0, MAX_PHOTO_PLANTS).entries()) {
    const where = `plants[${i}]`
    const name = typeof pl?.name === 'string' ? pl.name.trim() : ''
    const note = typeof pl?.note === 'string' && pl.note.trim() ? pl.note.trim().slice(0, MAX_NOTE) : null
    const p = parseGridCell(typeof pl?.cell === 'string' ? pl.cell : null)
    if (!name || name.length > MAX_NAME) {
      errors.push(`${where}: name is required (up to ${MAX_NAME} characters).`)
      continue
    }
    if (!p || !inGrid(p.row, p.col)) {
      errors.push(`${where} (${name}): cell must be "row,col" or "row,col:k" inside the grid.`)
      continue
    }
    const hex = cellKey(p.row, p.col)
    const cell = cellKey(p.row, p.col, p.sub)
    const photo =
      Array.isArray(pl.photo) && pl.photo.length === 2 && pl.photo.every((n) => typeof n === 'number' && n >= 0 && n <= 1)
        ? ([pl.photo[0], pl.photo[1]] as [number, number])
        : null
    if (pl.photo !== undefined && !photo) errors.push(`${where} (${name}): photo must be [x, y], each from 0 to 1.`)
    const extra: string[] = []
    for (const x of Array.isArray(pl.cells) ? pl.cells : []) {
      const q = parseGridCell(typeof x === 'string' ? x : null)
      const xHex = q ? cellKey(q.row, q.col) : String(x)
      if (!q || q.sub !== null || !inGrid(q.row, q.col)) errors.push(`${where} (${name}): cells must be whole hexes "row,col" inside the grid.`)
      else if (p.sub !== null) errors.push(`${where} (${name}): a plant in a small cell can't cover more hexes.`)
      else if (blocked.has(xHex)) errors.push(`${where} (${name}): ${xHex} is marked outside the bed.`)
      else if (split.has(xHex) || [...used].some((u) => hexOf(u) === xHex) || xHex === hex) {
        errors.push(`${where} (${name}): ${xHex} already has a plant.`)
      } else if (!extra.includes(xHex)) extra.push(xHex)
    }
    if (blocked.has(hex)) errors.push(`${where} (${name}): ${hex} is marked outside the bed.`)
    else if (used.has(cell)) errors.push(`${where} (${name}): ${cell} already has a plant.`)
    else if (p.sub === null ? [...used].some((u) => u !== hex && hexOf(u) === hex) : used.has(hex)) {
      errors.push(`${where} (${name}): ${hex} can't hold a whole-hex plant and small-cell plants together.`)
    } else {
      used.add(cell)
      for (const x of extra) used.add(x)
      if (p.sub !== null) split.add(hex)
      plants.push({ row: p.row, col: p.col, sub: p.sub, name, note, extraCells: extra, photo })
    }
  }

  // A split hex with a whole-hex plant already in it can't stay whole
  for (const hex of split) {
    if (used.has(hex) && [...used].some((u) => u !== hex && hexOf(u) === hex)) errors.push(`${hex} has a whole-hex plant and small-cell plants.`)
  }

  if (errors.length > 0) return { ok: false, errors }
  return {
    ok: true,
    plan: {
      rows,
      cols,
      rowShift,
      blockedCells: [...blocked].sort(),
      splitCells: [...split].filter((h) => {
        const p = parseGridCell(h)
        return p !== null && inGrid(p.row, p.col) && !blocked.has(h)
      }),
      plants,
    },
  }
}
