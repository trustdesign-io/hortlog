/** Places in a garden, nested: Princess of Wales Conservatory › Arid › Madagascar. Pure, so it can be tested. */

export interface LocationNode {
  id: string
  name: string
  parentId: string | null
}

export const MAX_LOCATION_NAME = 80

/** The chain from the outermost place down to this one, e.g. [Conservatory, Arid, Madagascar] */
export function locationPath<T extends LocationNode>(locations: T[], id: string | null): T[] {
  const byId = new Map(locations.map((l) => [l.id, l]))
  const path: T[] = []
  const seen = new Set<string>()
  for (let at = id ? byId.get(id) : undefined; at && !seen.has(at.id); at = at.parentId ? byId.get(at.parentId) : undefined) {
    seen.add(at.id)
    path.unshift(at)
  }
  return path
}

/** This place and every place inside it, at any depth */
export function withinIds(locations: LocationNode[], id: string): string[] {
  const out = [id]
  for (let i = 0; i < out.length; i++) {
    for (const l of locations) if (l.parentId === out[i] && !out.includes(l.id)) out.push(l.id)
  }
  return out
}

/** Whether putting `id` inside `parentId` would put a place inside itself */
export function wouldNestInItself(locations: LocationNode[], id: string, parentId: string | null): boolean {
  return parentId !== null && withinIds(locations, id).includes(parentId)
}

/** The tree flattened in display order, each with its depth: for lists and pickers */
export function flattenTree<T extends LocationNode>(locations: T[]): (T & { depth: number })[] {
  const ids = new Set(locations.map((l) => l.id))
  const childrenOf = (parentId: string | null) =>
    locations
      .filter((l) => (parentId === null ? l.parentId === null || !ids.has(l.parentId) : l.parentId === parentId))
      .sort((a, b) => a.name.localeCompare(b.name))
  const out: (T & { depth: number })[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const l of childrenOf(parentId)) {
      if (out.some((o) => o.id === l.id)) continue
      out.push({ ...l, depth })
      walk(l.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

/** A name as typed, tidied; null if empty or too long */
export function cleanLocationName(raw: unknown): string | null {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : ''
  return name.length > 0 && name.length <= MAX_LOCATION_NAME ? name : null
}
