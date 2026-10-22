/** A small CSV reader for spreadsheets people upload. Pure, so it can be tested. */

/** Comma, semicolon or tab: whichever the header line uses most (outside quotes) */
export function detectDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  let inQuotes = false
  const counts = { ',': 0, ';': 0, '\t': 0 }
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes
    else if (!inQuotes && ch in counts) counts[ch as keyof typeof counts]++
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ',' | ';' | '\t') ?? ','
}

/** Rows of cells. Handles quoted cells with commas, quotes ("") and line breaks; skips blank lines. */
export function parseCsv(input: string, delimiter: string = detectDelimiter(input)): string[][] {
  const text = input.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
    } else if (ch === '"' && cell === '') inQuotes = true
    else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows
}
