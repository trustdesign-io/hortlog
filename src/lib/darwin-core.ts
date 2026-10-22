/**
 * Darwin Core Archive for a garden's living collection: the standard format
 * GBIF and BGCI PlantSearch take. Pure, so it can be tested.
 * https://dwc.tdwg.org/text/
 */

export const DWC_LICENCES = {
  CC0: { label: 'CC0 (no rights reserved)', url: 'http://creativecommons.org/publicdomain/zero/1.0/legalcode' },
  'CC-BY': { label: 'CC BY 4.0 (credit the garden)', url: 'http://creativecommons.org/licenses/by/4.0/legalcode' },
  'CC-BY-NC': { label: 'CC BY-NC 4.0 (credit, non-commercial)', url: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode' },
} as const
export type DwcLicence = keyof typeof DWC_LICENCES

export function isDwcLicence(v: unknown): v is DwcLicence {
  return typeof v === 'string' && v in DWC_LICENCES
}

export interface DwcPlant {
  slug: string
  accessionNumber: string | null
  scientificName: string
  authority: string | null
  family: string | null
  ipniId: string | null
  /** Where it is, outermost first: Conservatory › Arid › Madagascar */
  places: string[]
  latitude: number | null
  longitude: number | null
  updatedAt: Date
}

export interface DwcGarden {
  slug: string
  name: string
  siteUrl: string
  latitude: number | null
  longitude: number | null
}

/** The columns, in order, with their Darwin Core term URIs */
export const DWC_COLUMNS = [
  ['occurrenceID', 'http://rs.tdwg.org/dwc/terms/occurrenceID'],
  ['basisOfRecord', 'http://rs.tdwg.org/dwc/terms/basisOfRecord'],
  ['institutionCode', 'http://rs.tdwg.org/dwc/terms/institutionCode'],
  ['collectionCode', 'http://rs.tdwg.org/dwc/terms/collectionCode'],
  ['catalogNumber', 'http://rs.tdwg.org/dwc/terms/catalogNumber'],
  ['scientificName', 'http://rs.tdwg.org/dwc/terms/scientificName'],
  ['scientificNameAuthorship', 'http://rs.tdwg.org/dwc/terms/scientificNameAuthorship'],
  ['scientificNameID', 'http://rs.tdwg.org/dwc/terms/scientificNameID'],
  ['kingdom', 'http://rs.tdwg.org/dwc/terms/kingdom'],
  ['family', 'http://rs.tdwg.org/dwc/terms/family'],
  ['degreeOfEstablishment', 'http://rs.tdwg.org/dwc/terms/degreeOfEstablishment'],
  ['locality', 'http://rs.tdwg.org/dwc/terms/locality'],
  ['decimalLatitude', 'http://rs.tdwg.org/dwc/terms/decimalLatitude'],
  ['decimalLongitude', 'http://rs.tdwg.org/dwc/terms/decimalLongitude'],
  ['geodeticDatum', 'http://rs.tdwg.org/dwc/terms/geodeticDatum'],
  ['references', 'http://purl.org/dc/terms/references'],
  ['modified', 'http://purl.org/dc/terms/modified'],
] as const

/** A CSV cell: quoted when it holds a comma, quote or line break */
export function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function xml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Plants not yet identified have nothing to publish */
export function publishable(p: DwcPlant): boolean {
  return p.scientificName.trim() !== '' && p.scientificName !== 'Unidentified'
}

export function occurrenceRow(p: DwcPlant, g: DwcGarden): string[] {
  const url = `${g.siteUrl}/${g.slug}/specimens/${p.slug}`
  const lat = p.latitude ?? g.latitude
  const lng = p.longitude ?? g.longitude
  const values: Record<(typeof DWC_COLUMNS)[number][0], string | number | null> = {
    occurrenceID: url,
    basisOfRecord: 'LivingSpecimen',
    institutionCode: g.name,
    collectionCode: 'Living collection',
    catalogNumber: p.accessionNumber,
    scientificName: p.authority ? `${p.scientificName} ${p.authority}` : p.scientificName,
    scientificNameAuthorship: p.authority,
    scientificNameID: p.ipniId ? `urn:lsid:ipni.org:names:${p.ipniId}` : null,
    kingdom: 'Plantae',
    family: p.family,
    degreeOfEstablishment: 'cultivated',
    locality: [g.name, ...p.places].join(' › '),
    decimalLatitude: lat === null ? null : Number(lat.toFixed(5)),
    decimalLongitude: lng === null ? null : Number(lng.toFixed(5)),
    geodeticDatum: lat === null ? null : 'WGS84',
    references: url,
    modified: p.updatedAt.toISOString(),
  }
  return DWC_COLUMNS.map(([name]) => csvCell(values[name]))
}

export function occurrenceCsv(plants: DwcPlant[], g: DwcGarden): string {
  const header = DWC_COLUMNS.map(([name]) => name).join(',')
  const rows = plants.filter(publishable).map((p) => occurrenceRow(p, g).join(','))
  return [header, ...rows].join('\r\n') + '\r\n'
}

/** Tells GBIF which column is which term */
export function metaXml(): string {
  const fields = DWC_COLUMNS.map(([, term], i) => `    <field index="${i}" term="${term}"/>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<archive xmlns="http://rs.tdwg.org/dwc/text/" metadata="eml.xml">
  <core encoding="UTF-8" fieldsTerminatedBy="," linesTerminatedBy="\\r\\n" fieldsEnclosedBy="&quot;" ignoreHeaderLines="1" rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
    <files>
      <location>occurrence.csv</location>
    </files>
    <id index="0"/>
${fields}
  </core>
</archive>
`
}

/** Who published the dataset, what it is, and its licence */
export function emlXml(g: DwcGarden, licence: DwcLicence, count: number, now: Date): string {
  const l = DWC_LICENCES[licence]
  const day = now.toISOString().slice(0, 10)
  return `<?xml version="1.0" encoding="UTF-8"?>
<eml:eml xmlns:eml="eml://ecoinformatics.org/eml-2.1.1" xmlns:dc="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="eml://ecoinformatics.org/eml-2.1.1 http://rs.gbif.org/schema/eml-gbif-profile/1.1/eml.xsd" packageId="${xml(`${g.siteUrl}/${g.slug}/dwc/${day}`)}" system="hortlog" scope="system" xml:lang="en">
  <dataset>
    <title xml:lang="en">${xml(`${g.name}: living collection`)}</title>
    <creator>
      <organizationName>${xml(g.name)}</organizationName>
    </creator>
    <metadataProvider>
      <organizationName>${xml(g.name)}</organizationName>
    </metadataProvider>
    <pubDate>${day}</pubDate>
    <language>en</language>
    <abstract>
      <para>${xml(`The ${count} identified plants in the living collection of ${g.name}, with where each is in the garden. Exported from hortlog on ${day}.`)}</para>
    </abstract>
    <intellectualRights>
      <para>This work is licensed under a <ulink url="${l.url}"><citetitle>${xml(l.label)}</citetitle></ulink>.</para>
    </intellectualRights>
    <contact>
      <organizationName>${xml(g.name)}</organizationName>
    </contact>
  </dataset>
</eml:eml>
`
}
