import { STICKER_MM } from './sticker-label'

/**
 * Where the 25 mm QR stickers sit on an A4 sheet, in millimetres. Every
 * measurement is here so the layout can be matched to a real sheet: print a
 * test page on plain paper, hold it against the sticker sheet, and adjust the
 * margins and gaps (they can also be set per print in the page's address).
 */

export const A4 = { width: 210, height: 297 } as const

export interface SheetLayout {
  cols: number
  rows: number
  /** Label width and height */
  label: number
  /** Space between labels across */
  gapX: number
  /** Space between labels down */
  gapY: number
  /** From the sheet's left edge to the first label */
  left: number
  /** From the sheet's top edge to the first label */
  top: number
}

/**
 * Label Planet LP70/25SQ, as published: 7 × 10 labels of 25 mm on a 27 mm
 * pitch (2 mm gaps), 11.5 mm side margins and 14.5 mm top and bottom margins.
 * 2 × 11.5 + 7 × 25 + 6 × 2 = 210; 2 × 14.5 + 10 × 25 + 9 × 2 = 297.
 */
export const DEFAULT_SHEET_LAYOUT: SheetLayout = {
  cols: 7,
  rows: 10,
  label: STICKER_MM,
  gapX: 2,
  gapY: 2,
  left: 11.5,
  top: 14.5,
}

/** Measurements that can be adjusted from the page, with their limits. */
export const ADJUSTABLE = {
  left: { label: 'Left margin', max: 30 },
  top: { label: 'Top margin', max: 30 },
  gapX: { label: 'Gap across', max: 10 },
  gapY: { label: 'Gap down', max: 10 },
} as const

export type AdjustableKey = keyof typeof ADJUSTABLE

/** The default layout with any adjustments from the address; bad values are ignored. */
export function sheetLayoutFrom(params: Partial<Record<string, string | string[] | undefined>>): SheetLayout {
  const layout = { ...DEFAULT_SHEET_LAYOUT }
  for (const key of Object.keys(ADJUSTABLE) as AdjustableKey[]) {
    const raw = params[key]
    const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN
    if (Number.isFinite(n) && n >= 0 && n <= ADJUSTABLE[key].max) layout[key] = Math.round(n * 100) / 100
  }
  return layout
}

export function labelsPerSheet(layout: SheetLayout): number {
  return layout.cols * layout.rows
}

/** Top-left corner of the label at `index` (0-based, across then down) on its sheet. */
export function labelOrigin(index: number, layout: SheetLayout): { x: number; y: number } {
  const col = index % layout.cols
  const row = Math.floor(index / layout.cols)
  return {
    x: Number((layout.left + col * (layout.label + layout.gapX)).toFixed(3)),
    y: Number((layout.top + row * (layout.label + layout.gapY)).toFixed(3)),
  }
}

/** Whether every label lands on the page. */
export function fitsPage(layout: SheetLayout): boolean {
  const last = labelOrigin(labelsPerSheet(layout) - 1, layout)
  return last.x + layout.label <= A4.width + 1e-6 && last.y + layout.label <= A4.height + 1e-6
}

/** Split items into sheets. */
export function intoSheets<T>(items: T[], layout: SheetLayout): T[][] {
  const per = labelsPerSheet(layout)
  const sheets: T[][] = []
  for (let i = 0; i < items.length; i += per) sheets.push(items.slice(i, i + per))
  return sheets
}
