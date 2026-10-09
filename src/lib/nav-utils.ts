/**
 * Returns the first URL segment if it appears in knownSlugs, otherwise null.
 *
 * Used by the sidebar to determine whether the current path is inside an
 * organisation, validated against the slugs the user actually has access to.
 */
export function getOrgSlugFromPath(
  pathname: string | null,
  knownSlugs: string[],
): string | null {
  if (!pathname) return null
  const first = pathname.split('/').filter(Boolean)[0]
  if (!first) return null
  return knownSlugs.includes(first) ? first : null
}

/**
 * Returns the href of the most-specific nav item that matches `pathname`.
 *
 * An item matches if pathname equals its href exactly, or starts with
 * `href + '/'`. Among all matching items, the one with the longest href
 * wins — this prevents a short prefix like `/{org}` from staying active
 * alongside a more-specific page like `/{org}/todo`.
 */
export function getActiveHref(
  items: { href: string }[],
  pathname: string,
): string | null {
  const matching = items.filter(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
  )
  if (matching.length === 0) return null
  return matching.reduce((best, curr) =>
    curr.href.length > best.href.length ? curr : best,
  ).href
}
