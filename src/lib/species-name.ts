/**
 * The common name, or null when there isn't a real one: species without a
 * common name store their scientific name there, and showing it twice
 * ("Pachypodium lamerei / Pachypodium lamerei") looks like a mistake.
 */
export function distinctCommonName(species: { commonName: string; scientificName: string }): string | null {
  const common = species.commonName.trim()
  return common && common.toLowerCase() !== species.scientificName.trim().toLowerCase() ? common : null
}
