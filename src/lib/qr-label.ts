/** Layout for a printable QR label: the code, with the scene name beneath it. */
export const LABEL_SIZE = 1000
/** White border around the whole label, outside the code's own quiet zone. */
export const LABEL_PADDING = 60
/** Quiet zone in modules; 4 is the QR standard and scans most reliably. */
export const QR_MARGIN = 4
export const LABEL_FONT_SIZE = 72
export const LABEL_LINE_HEIGHT = 88
const MAX_CHARS_PER_LINE = 22
const MAX_LINES = 2

/** Breaks a name into at most two lines that fit under the code, ending in "…" if cut short. */
export function wrapLabel(text: string, maxChars = MAX_CHARS_PER_LINE, maxLines = MAX_LINES): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word
  }
  if (current) lines.push(current)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  const last = kept[maxLines - 1]
  kept[maxLines - 1] = last.length >= maxChars ? `${last.slice(0, maxChars - 1)}…` : `${last}…`
  return kept
}

export const LABEL_WIDTH = LABEL_SIZE + LABEL_PADDING * 2

/** Height of the label: the padded square code plus room for the name. */
export function labelHeight(lines: number): number {
  return LABEL_SIZE + LABEL_PADDING * 2 + (lines > 0 ? lines * LABEL_LINE_HEIGHT : 0)
}

/** Baseline of each name line, below the code. */
export function lineBaseline(i: number): number {
  return LABEL_PADDING + LABEL_SIZE + LABEL_LINE_HEIGHT * (i + 1) - 20
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Wraps the QR code's SVG in a label with the scene name centred underneath. */
export function labelSvg(qrSvg: string, name: string, fontFamily = 'Helvetica, Arial, sans-serif'): string {
  const lines = wrapLabel(name)
  const height = labelHeight(lines.length)
  const inner = qrSvg
    .replace(/<\?xml[^>]*>\s*/, '')
    // the label sets the code's position and size
    .replace(/<svg\b([^>]*?)\swidth="\d+"/, '<svg$1')
    .replace(/<svg\b([^>]*?)\sheight="\d+"/, '<svg$1')
    .replace(/<svg\b/, `<svg x="${LABEL_PADDING}" y="${LABEL_PADDING}" width="${LABEL_SIZE}" height="${LABEL_SIZE}"`)
  const text = lines
    .map(
      (line, i) =>
        `<text x="${LABEL_WIDTH / 2}" y="${lineBaseline(i)}" text-anchor="middle" font-family="${escapeXml(fontFamily)}" font-size="${LABEL_FONT_SIZE}" font-weight="600" fill="#000000">${escapeXml(line)}</text>`,
    )
    .join('')
  // Faint cut line so the white border shows on white paper
  const cut = `<rect x="1" y="1" width="${LABEL_WIDTH - 2}" height="${height - 2}" fill="none" stroke="#cccccc" stroke-width="2" stroke-dasharray="12 8"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LABEL_WIDTH}" height="${height}" viewBox="0 0 ${LABEL_WIDTH} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${cut}${inner}${text}</svg>`
}
