import { describe, expect, it } from 'vitest'
import { csvCell, DWC_COLUMNS, emlXml, metaXml, occurrenceCsv, type DwcGarden, type DwcPlant } from './darwin-core'

const garden: DwcGarden = { slug: 'acme', name: 'Acme, "Gardens"', siteUrl: 'https://hortlog.com', latitude: 51.4, longitude: 0.2 }
const plant = (over: Partial<DwcPlant> = {}): DwcPlant => ({
  slug: 'didierea-trollii',
  accessionNumber: '1973-123',
  scientificName: 'Didierea trollii',
  authority: 'Capuron & Rauh',
  family: 'Didiereaceae',
  ipniId: '123-1',
  places: ['Conservatory', 'Madagascar'],
  latitude: null,
  longitude: null,
  updatedAt: new Date('2026-10-20T10:00:00Z'),
  ...over,
})

describe('csvCell', () => {
  it('quotes only when needed', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a, b')).toBe('"a, b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell(null)).toBe('')
  })
})

describe('occurrenceCsv', () => {
  it('writes a header and one row per identified plant', () => {
    const csv = occurrenceCsv([plant(), plant({ slug: 'x', scientificName: 'Unidentified' })], garden)
    const lines = csv.trim().split('\r\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe(DWC_COLUMNS.map(([n]) => n).join(','))
    expect(lines[1]).toContain('https://hortlog.com/acme/specimens/didierea-trollii')
    expect(lines[1]).toContain('LivingSpecimen')
    expect(lines[1]).toContain('Didierea trollii Capuron & Rauh')
    expect(lines[1]).toContain('urn:lsid:ipni.org:names:123-1')
    expect(lines[1]).toContain('cultivated')
    // Falls back to the garden's coordinates
    expect(lines[1]).toContain('51.4,0.2,WGS84')
  })

  it('has the same number of cells as columns, even with commas and quotes', () => {
    const row = occurrenceCsv([plant()], garden).trim().split('\r\n')[1]
    // Count cells by parsing quoted CSV
    const cells = row.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.filter((c) => c !== '')
    expect(cells).toHaveLength(DWC_COLUMNS.length)
  })
})

describe('meta and eml', () => {
  it('maps every column to a term', () => {
    const meta = metaXml()
    expect(meta.match(/<field /g)).toHaveLength(DWC_COLUMNS.length)
    expect(meta).toContain('rowType="http://rs.tdwg.org/dwc/terms/Occurrence"')
  })

  it('escapes the garden name and states the licence', () => {
    const eml = emlXml(garden, 'CC-BY', 1, new Date('2026-10-22T00:00:00Z'))
    expect(eml).toContain('Acme, &quot;Gardens&quot;: living collection')
    expect(eml).toContain('creativecommons.org/licenses/by/4.0')
    expect(eml).toContain('<pubDate>2026-10-22</pubDate>')
  })
})
