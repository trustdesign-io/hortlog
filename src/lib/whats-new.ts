/** The latest improvements, shown once to each visitor when they change. Bump UPDATE_ID with each new list. */

export const WHATS_NEW_UPDATE_ID = '2026-10-22'
export const WHATS_NEW_SEEN_KEY = 'hortlog-whats-new-seen'

export interface WhatsNewItem {
  title: string
  text: string
  /** Somewhere to see it, for visitors who aren't signed in */
  href?: string
}

export const WHATS_NEW: WhatsNewItem[] = [
  { title: 'Try it without signing up', text: 'A live demo of a real scene: tap the plants, the QR code and the details.', href: '/demo' },
  { title: 'In flower now', text: 'Staff mark plants in bud, flower or fruit; visitors see what’s flowering, by place, and gardens can show it on their own website.' },
  { title: 'Notes from the team', text: 'Short notes pinned to a bed for visitors, like the chalkboards in it.' },
  { title: 'Report a label', text: 'Visitors and staff can flag a missing or wrong label; it lands on the garden’s to-do list.' },
  { title: 'Import your accessions', text: 'From your records system, any spreadsheet or Darwin Core. Matched by accession number, so hortlog works alongside what you have.' },
  { title: 'Share with GBIF and BGCI', text: 'Download your living collection as a Darwin Core Archive.' },
  { title: 'Names checked with Kew', text: 'Every name is checked against the World Checklist of Vascular Plants behind Plants of the World Online, with synonyms flagged.' },
  { title: 'Learning log', text: 'Apprentices and trainees choose a supervisor, who signs off their work with comments.' },
  { title: 'Likes', text: 'Members can like each other’s work.' },
]
