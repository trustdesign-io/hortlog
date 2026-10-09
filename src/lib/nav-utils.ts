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
