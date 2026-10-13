export const MAX_TYPE_NAME = 40

/** Tidies a collection type name: trims and collapses inner spaces. */
export function normaliseTypeName(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ')
}

/** Why a type name can't be used, or null when it's fine. */
export function typeNameError(name: string): string | null {
  if (!name) return 'Type name is required.'
  if (name.length > MAX_TYPE_NAME) return `Type names must be ${MAX_TYPE_NAME} characters or fewer.`
  return null
}

export interface TypedItem {
  typeId: string | null
}

export interface TypeGroup<T> {
  type: { id: string; name: string } | null
  items: T[]
}

/** Groups items under their type, in the types' order, with untyped items last. */
export function groupByType<T extends TypedItem>(
  items: T[],
  types: Array<{ id: string; name: string }>,
): TypeGroup<T>[] {
  const groups: TypeGroup<T>[] = types
    .map((type) => ({ type, items: items.filter((i) => i.typeId === type.id) }))
    .filter((g) => g.items.length > 0)
  const known = new Set(types.map((t) => t.id))
  const untyped = items.filter((i) => i.typeId === null || !known.has(i.typeId))
  if (untyped.length > 0) groups.push({ type: null, items: untyped })
  return groups
}
