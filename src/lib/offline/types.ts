/**
 * The copy of an organisation a member keeps on their device for offline use.
 * Built by /api/offline-data/[org] and stored in IndexedDB.
 */

export const SNAPSHOT_VERSION = 1

export interface OfflineSpecies {
  commonName: string
  scientificName: string
  authority: string | null
  family: string | null
  origin: string | null
  description: string | null
  photoUrl: string | null
  status: string | null
}

export interface OfflineSpecimen {
  id: string
  slug: string
  cultivar: string | null
  accessionNumber: string | null
  notes: string | null
  imageUrl: string | null
  sceneId: string | null
  gridCell: string | null
  /** More hexes a big plant covers */
  extraCells?: string[]
  /** Where it is on its scene's bed photo, 0–1 from the left and top */
  photoX?: number | null
  photoY?: number | null
  collectionIds: string[]
  species: OfflineSpecies
  /** Added on this device and not yet sent */
  pending?: boolean
}

export interface OfflineScene {
  id: string
  name: string
  /** Optional on-screen title (missing in older saved copies) */
  title?: string | null
  /** In use at the venue (missing in older saved copies, which only had active scenes) */
  active?: boolean
  /** Changed on this device and not yet sent */
  pending?: boolean
  slug: string
  shortCode: string
  gridRows: number
  gridCols: number
  rowShift: number
  /** Hexes split into seven smaller cells (missing in copies saved before splitting existed) */
  splitCells?: string[]
  /** Hexes outside the bed's outline */
  blockedCells?: string[]
  /** When its bed photo was last sent to hortlog (ISO), or null if it has none */
  photoVersion?: string | null
  perspective: 'BED' | 'WALL'
  primaryCollectionId: string | null
}

export interface OfflineCollection {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface OfflineTask {
  id: string
  title: string
  description: string | null
  status: 'OPEN' | 'DONE'
  dueDate: string | null
  completedAt: string | null
  careAction: string | null
  specimenId: string | null
  sceneId: string | null
  cells: string[]
  assignees: string[]
  /** Changed on this device and not yet sent */
  pending?: boolean
}

export interface OfflineLogEntry {
  id: string
  date: string
  action: string
  actionNote: string | null
  location: string | null
  text: string | null
  /** Recorded on this device and not yet sent */
  pending?: boolean
}

export interface OfflineWorkRecord {
  id: string
  recordNumber: number
  specimenId: string | null
  scientificName: string
  firstWorkedDate: string
  entries: OfflineLogEntry[]
  /** Started on this device; numbered once it's sent */
  pending?: boolean
}

export interface OrgSnapshot {
  version: number
  syncedAt: string
  user: { id: string; name: string | null; canManage: boolean }
  org: { id: string; slug: string; name: string }
  specimens: OfflineSpecimen[]
  scenes: OfflineScene[]
  collections: OfflineCollection[]
  tasks: OfflineTask[]
  /** The signed-in member's own records for plants in this organisation */
  myRecords: OfflineWorkRecord[]
  /** Species already in hortlog, for naming new plants offline (managers only) */
  speciesList?: OfflineSpeciesOption[]
}

export interface OfflineSpeciesOption {
  id: string
  scientificName: string
  commonName: string
}

/** Width the offline pages ask the image optimiser for: one of Next's default image sizes. */
export const OFFLINE_IMAGE_WIDTH = 384

/**
 * The resized copy of a photo the offline pages show. Going through Next's
 * image optimiser keeps each saved photo small and same-origin.
 */
export function offlineImageUrl(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${OFFLINE_IMAGE_WIDTH}&q=75`
}

/** The photo to show for a plant: its own, else its species' reference photo. */
export function specimenPhoto(s: OfflineSpecimen): string | null {
  return s.imageUrl ?? s.species.photoUrl
}

/** Every image a snapshot's pages show, as offline image URLs, for saving. */
/** A scene's bed photo; the version makes a retaken photo a new address, so caches never serve the old one */
export function bedPhotoUrl(org: string, sceneId: string, version?: string | null): string {
  const base = `/api/scene-photo/${encodeURIComponent(org)}/${encodeURIComponent(sceneId)}`
  return version ? `${base}?v=${encodeURIComponent(version)}` : base
}

export function snapshotImageUrls(s: OrgSnapshot): string[] {
  const urls = new Set<string>()
  for (const sp of s.specimens) {
    const photo = specimenPhoto(sp)
    if (photo) urls.add(offlineImageUrl(photo))
  }
  // Bed photos, so scenes can be worked on without signal
  for (const sc of s.scenes) {
    if (sc.photoVersion) urls.add(bedPhotoUrl(s.org.slug, sc.id, sc.photoVersion))
  }
  return [...urls]
}
