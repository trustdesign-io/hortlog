/** Likes on work entries. Pure, so server and client pages can share it. */

/** "Liked by Simone and Tom", "Liked by Simone, Tom and 3 others" */
export function likedByLine(names: string[]): string | null {
  if (names.length === 0) return null
  if (names.length === 1) return `Liked by ${names[0]}`
  if (names.length <= 3) return `Liked by ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return `Liked by ${names.slice(0, 2).join(', ')} and ${names.length - 2} others`
}
