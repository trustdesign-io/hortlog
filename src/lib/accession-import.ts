/**
 * Importing a garden's accessions: from a Darwin Core file, or any spreadsheet
 * with its columns matched by hand. Pure, so it can be tested and run in the browser.
 */

export const IMPORT_FIELDS = {
  accessionNumber: 'Accession number',
  scientificName: 'Scientific name',
  authority: 'Author (authority)',
  commonName: 'Common name',
  location: 'Location',
  notes: 'Notes',
} as const
export type ImportField = keyof typeof IMPORT_FIELDS
/** For each field, the index of the column it comes from, or null for none */
export type ImportMapping = Record<ImportField, number | null>

export const MAX_IMPORT_ROWS = 5000
/** Rows sent to the server at a time, so a big file never times out */
export const IMPORT_CHUNK = 25

export interface ImportRow {
  accessionNumber: string | null
  scientificName: string
  authority: string | null
  commonName: string | null
  /** Outermost first: Princess of Wales Conservatory › Arid › Madagascar */
  location: string[]
  notes: string | null
}

/** Darwin Core terms for each field, as column headers or in meta.xml */
export const DWC_TERMS: Record<ImportField, string[]> = {
  accessionNumber: ['catalogNumber', 'otherCatalogNumbers', 'materialSampleID'],
  scientificName: ['scientificName'],
  authority: ['scientificNameAuthorship'],
  commonName: ['vernacularName'],
  location: ['locality', 'locationRemarks'],
  notes: ['occurrenceRemarks'],
}

/** Spreadsheet headings people use for each field, lower-case, without punctuation */
const HEADER_GUESSES: Record<ImportField, string[]> = {
  accessionNumber: ['accession number', 'accession no', 'accession', 'acc no', 'accno', 'catalog number', 'catalognumber', 'accession id', 'id'],
  scientificName: ['scientific name', 'scientificname', 'taxon', 'taxon name', 'name', 'botanical name', 'species', 'latin name'],
  authority: ['authority', 'author', 'authors', 'scientificnameauthorship', 'name authority'],
  commonName: ['common name', 'vernacular name', 'vernacularname', 'english name'],
  location: ['location', 'bed', 'garden location', 'locality', 'area', 'site', 'position'],
  notes: ['notes', 'note', 'remarks', 'comments', 'occurrenceremarks'],
}

const tidyHeader = (h: string) => h.toLowerCase().replace(/^dwc:/, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

/** A first guess at which column is which, from the headings */
export function guessMapping(headers: string[]): ImportMapping {
  const tidy = headers.map(tidyHeader)
  const used = new Set<number>()
  const mapping = {} as ImportMapping
  for (const field of Object.keys(IMPORT_FIELDS) as ImportField[]) {
    const dwc = DWC_TERMS[field].map((t) => t.toLowerCase())
    let index = tidy.findIndex((h, i) => !used.has(i) && (dwc.includes(h.replace(/ /g, '')) || HEADER_GUESSES[field].includes(h)))
    if (index === -1) index = tidy.findIndex((h, i) => !used.has(i) && HEADER_GUESSES[field].some((g) => g.length > 3 && h.includes(g)))
    mapping[field] = index === -1 ? null : index
    if (index !== -1) used.add(index)
  }
  return mapping
}

/** Darwin Core's column for each field, from meta.xml's term list (by index) */
export function mappingFromMetaXml(metaXml: string): ImportMapping | null {
  const core = /<core[\s\S]*?<\/core>/.exec(metaXml)?.[0]
  if (!core) return null
  const terms = new Map<string, number>()
  for (const m of core.matchAll(/<field[^>]*index="(\d+)"[^>]*term="([^"]+)"/g)) terms.set(m[2].split('/').pop()!, Number(m[1]))
  for (const m of core.matchAll(/<field[^>]*term="([^"]+)"[^>]*index="(\d+)"/g)) terms.set(m[1].split('/').pop()!, Number(m[2]))
  const mapping = {} as ImportMapping
  for (const field of Object.keys(IMPORT_FIELDS) as ImportField[]) {
    const term = DWC_TERMS[field].find((t) => terms.has(t))
    mapping[field] = term === undefined ? null : terms.get(term)!
  }
  return mapping
}

/** "Conservatory › Arid › Madagascar", "Conservatory > Arid", "Conservatory / Arid", "A | B" */
export function splitLocation(raw: string): string[] {
  return raw
    .split(/\s*(?:›|>|\/|\||»|::)\s*/)
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, 6)
}

const clean = (v: string | undefined, max = 500) => {
  const t = (v ?? '').trim().replace(/\s+/g, ' ')
  return t ? t.slice(0, max) : null
}

/** "Didierea trollii Capuron & Rauh" → name without the trailing authority, when the authority is given separately */
function withoutAuthority(name: string, authority: string | null): string {
  if (authority && name.endsWith(` ${authority}`)) return name.slice(0, -authority.length - 1).trim()
  return name
}

/** The rows to import, and how many were skipped for having no name */
export function rowsFromTable(
  table: string[][],
  mapping: ImportMapping,
  { hasHeader = true, garden }: { hasHeader?: boolean; garden?: string } = {},
): { rows: ImportRow[]; skipped: number } {
  const body = hasHeader ? table.slice(1) : table
  const cell = (r: string[], f: ImportField) => (mapping[f] === null ? undefined : r[mapping[f] as number])
  const rows: ImportRow[] = []
  let skipped = 0
  for (const r of body.slice(0, MAX_IMPORT_ROWS)) {
    const authority = clean(cell(r, 'authority'), 200)
    const name = clean(cell(r, 'scientificName'), 200)
    if (!name) {
      skipped++
      continue
    }
    let location = splitLocation(cell(r, 'location') ?? '')
    // Darwin Core files often start the locality with the garden's own name: leave it off
    if (garden && location[0]?.toLowerCase() === garden.toLowerCase()) location = location.slice(1)
    rows.push({
      accessionNumber: clean(cell(r, 'accessionNumber'), 60),
      scientificName: withoutAuthority(name, authority),
      authority,
      commonName: clean(cell(r, 'commonName'), 120),
      location,
      notes: clean(cell(r, 'notes'), 2000),
    })
  }
  return { rows, skipped: skipped + Math.max(0, body.length - MAX_IMPORT_ROWS) }
}

export function isImportRow(v: unknown): v is ImportRow {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  const strOrNull = (x: unknown) => x === null || typeof x === 'string'
  return (
    typeof r.scientificName === 'string' &&
    r.scientificName.trim() !== '' &&
    r.scientificName.length <= 200 &&
    strOrNull(r.accessionNumber) &&
    strOrNull(r.authority) &&
    strOrNull(r.commonName) &&
    strOrNull(r.notes) &&
    Array.isArray(r.location) &&
    r.location.length <= 6 &&
    r.location.every((p) => typeof p === 'string' && p.length > 0 && p.length <= 80)
  )
}
