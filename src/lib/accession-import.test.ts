import { describe, expect, it } from 'vitest'
import { detectDelimiter, parseCsv } from './csv'
import { guessMapping, mappingFromMetaXml, rowsFromTable, splitLocation } from './accession-import'
import { metaXml, occurrenceCsv } from './darwin-core'

describe('parseCsv', () => {
  it('handles quotes, commas, line breaks and blank lines', () => {
    const rows = parseCsv('a,b,c\r\n"x, y","say ""hi""","two\nlines"\n\n1,2,3\n')
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'say "hi"', 'two\nlines'],
      ['1', '2', '3'],
    ])
  })

  it('detects semicolons and tabs', () => {
    expect(detectDelimiter('Accession;Name;Bed\n1;2;3')).toBe(';')
    expect(detectDelimiter('Accession\tName\n')).toBe('\t')
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']])
  })
})

describe('guessMapping', () => {
  it('matches common spreadsheet headings', () => {
    const m = guessMapping(['Acc No.', 'Taxon', 'Author', 'Common name', 'Bed', 'Notes'])
    expect(m).toEqual({ accessionNumber: 0, scientificName: 1, authority: 2, commonName: 3, location: 4, notes: 5 })
  })

  it('matches Darwin Core headings', () => {
    const m = guessMapping(['occurrenceID', 'catalogNumber', 'scientificName', 'scientificNameAuthorship', 'locality'])
    expect(m.accessionNumber).toBe(1)
    expect(m.scientificName).toBe(2)
    expect(m.authority).toBe(3)
    expect(m.location).toBe(4)
    expect(m.commonName).toBeNull()
  })
})

describe('Darwin Core round trip', () => {
  it('reads back what hortlog exports', () => {
    const garden = { slug: 'kew', name: 'RBG Kew', siteUrl: 'https://hortlog.com', latitude: null, longitude: null }
    const csv = occurrenceCsv(
      [
        {
          slug: 'didierea-trollii',
          accessionNumber: '1973-123',
          scientificName: 'Didierea trollii',
          authority: 'Capuron & Rauh',
          family: 'Didiereaceae',
          ipniId: null,
          places: ['Princess of Wales Conservatory', 'Arid', 'Madagascar'],
          latitude: null,
          longitude: null,
          updatedAt: new Date(),
        },
      ],
      garden,
    )
    const mapping = mappingFromMetaXml(metaXml())!
    const { rows } = rowsFromTable(parseCsv(csv), mapping, { garden: 'RBG Kew' })
    expect(rows).toEqual([
      {
        accessionNumber: '1973-123',
        scientificName: 'Didierea trollii',
        authority: 'Capuron & Rauh',
        commonName: null,
        location: ['Princess of Wales Conservatory', 'Arid', 'Madagascar'],
        notes: null,
      },
    ])
  })
})

describe('splitLocation', () => {
  it('splits on the usual separators', () => {
    expect(splitLocation('Glasshouse > Arid / Bed 3')).toEqual(['Glasshouse', 'Arid', 'Bed 3'])
    expect(splitLocation('  ')).toEqual([])
  })
})

describe('rowsFromTable', () => {
  it('skips rows with no name', () => {
    const { rows, skipped } = rowsFromTable(
      [
        ['Acc', 'Name'],
        ['1', 'Aloe vera'],
        ['2', ''],
      ],
      { accessionNumber: 0, scientificName: 1, authority: null, commonName: null, location: null, notes: null },
    )
    expect(rows).toHaveLength(1)
    expect(skipped).toBe(1)
  })
})
