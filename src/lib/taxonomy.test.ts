import { describe, it, expect, vi } from 'vitest'
import { ipniIdFromPowoUrl, nameKey, orthoKey, resolveTaxon, spellingDistance, suggestNames, typedNameVariants } from './taxonomy'

function fakeFetcher(routes: [string, unknown][]) {
  return vi.fn(async (url: string) => {
    const hit = routes.find(([k]) => url.includes(k))
    if (!hit) throw new Error(`unexpected ${url}`)
    return hit[1]
  })
}

const synonym = {
  match: 'Sansevieria trifasciata Prain',
  context: 'Asparagaceae',
  usageId: '6XJ74',
  acceptedName: 'Dracaena trifasciata (Prain) Mabb.',
  rank: 'species',
  status: 'synonym',
  nomCode: 'botanical',
}

describe('suggestNames', () => {
  it('labels synonyms with the accepted name and keeps only plants', async () => {
    const fetcher = fakeFetcher([
      ['/nameusage/suggest', [synonym, { ...synonym, usageId: 'Z', nomCode: 'zoological' }]],
    ])
    const out = await suggestNames('Sansevieria trif', fetcher)
    expect(out).toEqual([
      {
        usageId: '6XJ74',
        label: 'Sansevieria trifasciata Prain',
        status: 'synonym',
        acceptedLabel: 'Dracaena trifasciata (Prain) Mabb.',
        family: 'Asparagaceae',
        rank: 'species',
      },
    ])
  })

  it('falls back to the closest spelling for a typo', async () => {
    const accepted = { match: 'Nesocodon mauritianus (I.Richardson) Thulin', usageId: 'N1', rank: 'species', status: 'accepted', nomCode: 'botanical' }
    const fetcher = vi.fn(async (url: string) => {
      if (url.includes('suggest') && url.includes('mauritanus')) return []
      if (url.includes('species/match')) return { canonicalName: 'Nesocodon mauritianus', matchType: 'FUZZY', confidence: 96 }
      if (url.includes('suggest')) return [accepted]
      throw new Error(url)
    })
    const out = await suggestNames('Nesocodon mauritanus', fetcher)
    expect(out.map((s) => s.usageId)).toEqual(['N1'])
  })

  it('does not guess at a single unknown word (usually a common name)', async () => {
    const fetcher = vi.fn(async (url: string) => (url.includes('suggest') ? [] : { canonicalName: 'Primula plantae', matchType: 'FUZZY', confidence: 95 }))
    expect(await suggestNames('snake', fetcher)).toEqual([])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('needs three characters and never throws', async () => {
    expect(await suggestNames('Ac')).toEqual([])
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await suggestNames('Acer', vi.fn(async () => { throw new Error('down') }))).toEqual([])
  })
})

describe('resolveTaxon', () => {
  it('follows a synonym to the accepted taxon', async () => {
    const fetcher = fakeFetcher([
      ['/nameusage/6XJ74', { id: '6XJ74', status: 'synonym', accepted: { id: '8WTWT' }, name: { scientificName: 'Sansevieria trifasciata', rank: 'species' } }],
      [
        '/nameusage/8WTWT',
        {
          id: '8WTWT',
          status: 'accepted',
          name: { scientificName: 'Dracaena trifasciata', authorship: '(Prain) Mabb.', rank: 'species', identifier: ['ipni:77164235-1'] },
          remarks: 'S. Nigeria to WC. Trop. Africa, Tanzania',
        },
      ],
      ['/taxon/8WTWT/classification', [{ rank: 'order', name: 'Asparagales' }, { rank: 'family', name: 'Asparagaceae' }]],
    ])
    expect(await resolveTaxon('6XJ74', fetcher)).toEqual({
      colId: '8WTWT',
      scientificName: 'Dracaena trifasciata',
      authority: '(Prain) Mabb.',
      rank: 'species',
      family: 'Asparagaceae',
      ipniId: '77164235-1',
      powoUrl: 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77164235-1',
      nativeRange: 'S. Nigeria to WC. Trop. Africa, Tanzania',
    })
  })
})

describe('nameKey and ipniIdFromPowoUrl', () => {
  it('compares names ignoring case and spacing', () => {
    expect(nameKey('  Quercus   Robur ')).toBe('quercus robur')
    expect(nameKey('× Chitalpa tashkentensis')).toBe(nameKey('x Chitalpa  tashkentensis'))
  })

  it('reads the IPNI id from either POWO link form', () => {
    expect(ipniIdFromPowoUrl('https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:529214-1')).toBe('529214-1')
    expect(ipniIdFromPowoUrl('https://powo.science.kew.org/taxon/781412-1')).toBe('781412-1')
    expect(ipniIdFromPowoUrl(null)).toBeNull()
  })
})

describe('typed names', () => {
  it('leaves out notes in brackets and cultivar names', () => {
    expect(typedNameVariants('Echinopsis (Red)')).toEqual(['Echinopsis (Red)', 'Echinopsis'])
    expect(typedNameVariants("Acer negundo 'Flamingo'")).toContain('Acer negundo')
  })

  it('reads a third word as a subspecies or variety when no rank is written', () => {
    expect(typedNameVariants('Trichocereus chiloensis panhoplites')).toEqual([
      'Trichocereus chiloensis panhoplites',
      'Trichocereus chiloensis subsp. panhoplites',
      'Trichocereus chiloensis var. panhoplites',
    ])
    expect(typedNameVariants('Aloe arborescens var. lutea')).toEqual(['Aloe arborescens var. lutea'])
  })

  it('treats spelling variants of an epithet as the same', () => {
    expect(orthoKey('leninghausii')).toBe(orthoKey('lenninghausii'))
    expect(orthoKey('millii')).toBe(orthoKey('milii'))
    expect(orthoKey('aestivalis')).toBe(orthoKey('estivalis'))
  })

  it('measures spelling distance word by word, ignoring authority and rank', () => {
    expect(spellingDistance('Parodia leninghausii', 'Parodia lenninghausii (F.Haage) F.H.Brandt ex Eggli & Hofacker')).toBe(0)
    expect(spellingDistance('Trichocereus chiloensis panhoplites', 'Trichocereus chiloensis subsp. panhoplites (K.Schum.) Albesiano')).toBe(0)
    expect(spellingDistance('Trichocereus chilensis panhoplites', 'Trichocereus chiloensis subsp. panhoplites (K.Schum.) Albesiano')).toBe(1)
    expect(spellingDistance('Parodia leninghausii', 'Echinopsis leninghausii')).toBe(Infinity)
  })
})

describe('suggestNames with spelling variants', () => {
  const lenninghausii = {
    match: 'Parodia lenninghausii (F.Haage) F.H.Brandt ex Eggli & Hofacker',
    context: 'Cactaceae',
    usageId: 'PL1',
    rank: 'species',
    status: 'accepted',
    nomCode: 'botanical',
  }
  const leucantha = { ...lenninghausii, match: 'Parodia leucantha (Salm-Dyck) Kiesling', usageId: 'PL2' }

  it('finds the catalogue spelling of a name spelt another way', async () => {
    const fetcher = vi.fn(async (url: string) =>
      decodeURIComponent(url).replace(/\+/g, ' ').includes('q=Parodia len&') ? [lenninghausii, leucantha] : [],
    )
    const out = await suggestNames('Parodia leninghausii', fetcher)
    expect(out.map((s) => s.usageId)).toEqual(['PL1'])
  })

  it('looks a name up as a subspecies when no rank was written', async () => {
    const sub = {
      match: 'Trichocereus chiloensis subsp. panhoplites (K.Schum.) Albesiano',
      acceptedName: 'Leucostele chiloensis subsp. panhoplites (K.Schum.) Schlumpb.',
      context: 'Cactaceae',
      usageId: 'TC1',
      rank: 'subspecies',
      status: 'synonym',
      nomCode: 'botanical',
    }
    const fetcher = vi.fn(async (url: string) =>
      decodeURIComponent(url).replace(/\+/g, ' ').includes('subsp. panhoplites') ? [sub] : [],
    )
    const out = await suggestNames('Trichocereus chiloensis panhoplites', fetcher)
    expect(out.map((s) => s.usageId)).toEqual(['TC1'])
  })
})
