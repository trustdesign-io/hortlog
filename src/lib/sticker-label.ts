import QRCode from 'qrcode'

/**
 * A 25 × 25 mm QR sticker, drawn in millimetres. Top to bottom: the site
 * name, the QR code with a 2-module quiet zone, then the scene name.
 */

export const STICKER_MM = 25
/** Width of the QR code including its quiet zone. */
export const QR_BLOCK_MM = 17
/** Quiet zone, in modules, kept clear of text on every side. */
export const QUIET_MODULES = 2
const QR_TOP_MM = 3.9
const DOMAIN_BASELINE_MM = 3.1
const DOMAIN_FONT_MM = 2.5
const NAME_BASELINE_MM = 23.7
const NAME_FONT_MM = 2.8
/** Widest the scene name may run before it's squeezed to fit. */
const NAME_MAX_WIDTH_MM = 22
const FONT_FAMILY = 'Helvetica, Arial, sans-serif'

/**
 * The URL encoded on a label. Scheme and host are written in capitals, which
 * the QR code can store in its compact alphanumeric mode; the short code stays
 * lowercase as stored. Every code then fits a 25 × 25 module code (version 2)
 * at error correction M, so each module prints larger.
 */
export function labelUrl(siteUrl: string, shortCode: string): string {
  return `${siteUrl.replace(/\/+$/, '').toUpperCase()}/v/${shortCode}`
}

export interface QrMatrix {
  size: number
  isDark: (row: number, col: number) => boolean
}

export function qrMatrix(text: string): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  return { size: qr.modules.size, isDark: (r, c) => Boolean(qr.modules.get(r, c)) }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Rough width of bold sans-serif text, in mm, to decide whether to squeeze it. */
function approxTextWidth(text: string, fontMm: number): number {
  return text.length * fontMm * 0.6
}

export interface StickerOptions {
  url: string
  name: string
  domain?: string
  /** Faint line on the 25 mm edge, for cutting labels out of plain paper */
  cutLine?: boolean
}

/** The QR modules as one path, in mm, positioned inside the label. */
export function qrPath(matrix: QrMatrix): { d: string; moduleMm: number; x0: number; y0: number } {
  const moduleMm = QR_BLOCK_MM / (matrix.size + QUIET_MODULES * 2)
  const x0 = (STICKER_MM - QR_BLOCK_MM) / 2 + QUIET_MODULES * moduleMm
  const y0 = QR_TOP_MM + QUIET_MODULES * moduleMm
  const m = Number(moduleMm.toFixed(4))
  const parts: string[] = []
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (!matrix.isDark(r, c)) continue
      const x = Number((x0 + c * moduleMm).toFixed(4))
      const y = Number((y0 + r * moduleMm).toFixed(4))
      parts.push(`M${x} ${y}h${m}v${m}h-${m}z`)
    }
  }
  return { d: parts.join(''), moduleMm, x0, y0 }
}

/** Inner SVG content (no outer <svg>), in a 25 × 25 mm coordinate space. */
export function stickerContent({ url, name, domain = 'hortlog.com', cutLine = false }: StickerOptions): string {
  const { d } = qrPath(qrMatrix(url))
  const mid = STICKER_MM / 2
  const squeeze =
    approxTextWidth(name, NAME_FONT_MM) > NAME_MAX_WIDTH_MM
      ? ` textLength="${NAME_MAX_WIDTH_MM}" lengthAdjust="spacingAndGlyphs"`
      : ''
  return [
    `<rect width="${STICKER_MM}" height="${STICKER_MM}" fill="#ffffff"/>`,
    cutLine
      ? `<rect x="0.05" y="0.05" width="${STICKER_MM - 0.1}" height="${STICKER_MM - 0.1}" fill="none" stroke="#bbbbbb" stroke-width="0.1"/>`
      : '',
    `<text x="${mid}" y="${DOMAIN_BASELINE_MM}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="${DOMAIN_FONT_MM}" font-weight="500" fill="#333333">${escapeXml(domain)}</text>`,
    `<path d="${d}" fill="#000000" shape-rendering="crispEdges"/>`,
    `<text x="${mid}" y="${NAME_BASELINE_MM}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="${NAME_FONT_MM}" font-weight="700" fill="#000000"${squeeze}>${escapeXml(name)}</text>`,
  ].join('')
}

/** A standalone 25 × 25 mm label SVG, printed at true size. */
export function stickerSvg(options: StickerOptions): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STICKER_MM}mm" height="${STICKER_MM}mm" viewBox="0 0 ${STICKER_MM} ${STICKER_MM}">${stickerContent(options)}</svg>`
}
