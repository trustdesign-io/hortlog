import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { WorkedRecordSheet, type WorkedRecordData } from '@/components/records/worked-record-sheet'

const record: WorkedRecordData = {
  id: 'rec15',
  recordNumber: 15,
  firstWorkedDate: new Date('2026-09-18T00:00:00Z'),
  scientificName: 'Nesocodon mauritianus',
  nameHtml: '<i>Nesocodon mauritianus</i> (I.Richardson) Thulin',
  authority: '(I.Richardson) Thulin',
  family: 'Campanulaceae',
  site: 'Lullingstone Castle, Eynsford, Kent',
  location: 'A polytunnel; its name not known',
  viceCounty: '16 W Kent',
  gridRef: null,
  projects: ['The Bleeding Bellflower - Nesocodon mauritianus'],
  determination: 'T. Hart Dyke (verbal), relayed to D.C. Chambers, 18 Sep 2026 — not keyed',
  labelText: 'Nescodon mauritianus / Danny Chambers',
  note: null,
  commonNames: 'Blue Mauritius bellflower',
  nativeRange: 'Mauritius',
  habit: 'Subshrub or shrub; wet tropical biome',
  provenance: 'Two plants from Mike Clifford, arrived Sept 2026.',
  diagnostic: 'Dwarf, straggly shrub 30–40 cm tall with unbranched, hairless woody stems grooved by old leaf scars.',
  nearMisses: '<i>Heterochaenia</i> (Mascarene genus): inflorescences several-flowered, not single-flowered.',
  workDone: null,
  observed: null,
  howStudied: null,
  sources: 'POWO, accessed 2 Oct 2026. Kew Bull. 34: 813 (1980).',
  openQuestions: 'Diagnostic from secondary sources; check against the plant.',
  powoUrl: 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:144220-1',
  userId: 'u1',
  organisation: { slug: 'lullingstone', name: 'Lullingstone Castle and the World Garden', recordsPublic: true },
  specimen: {
    slug: 'nesocodon-mauritianus',
    species: {
      commonName: 'Blue Mauritius bellflower',
      powoUrl: null,
      photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/338844420/medium.jpeg',
      photoAttribution: '(c) Daniel Cahen, some rights reserved (CC BY), uploaded by Daniel Cahen',
      photoLicence: 'CC BY',
      photoSourceUrl: 'https://www.inaturalist.org/photos/338844420',
    },
  },
  logEntries: [
    {
      id: 'log1',
      date: new Date('2026-10-03T00:00:00Z'),
      action: 'OTHER',
      actionNote: null,
      location: 'Terrarium at home',
      text: 'At home in the terrarium.',
    },
  ],
}

const meta: Meta<typeof WorkedRecordSheet> = {
  title: 'Records/WorkedRecordSheet',
  component: WorkedRecordSheet,
  args: { record },
  decorators: [(Story) => <div className="mx-auto max-w-2xl p-4">{Story()}</div>],
}

export default meta

type Story = StoryObj<typeof WorkedRecordSheet>

export const Default: Story = {}

export const Shared: Story = {
  args: { privateLinks: false },
}

export const PublicWithoutNotes: Story = {
  args: { privateLinks: false, publicView: { showNotes: false } },
}
