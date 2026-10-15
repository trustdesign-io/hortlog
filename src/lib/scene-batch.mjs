/**
 * Plans a numbered batch of scenes ("Scene 001" … "Scene 070") for one
 * organisation. Pure, so it can be tested; scripts/generate-scenes.mjs runs it, with no other imports so it runs under plain Node.
 */

export const SHORT_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function randomShortCode(random = Math.random) {
  return Array.from({ length: 6 }, () => SHORT_CODE_CHARS[Math.floor(random() * SHORT_CODE_CHARS.length)]).join('')
}

export function sceneName(n) {
  return `Scene ${String(n).padStart(3, '0')}`
}

export function sceneSlug(n) {
  return `scene-${String(n).padStart(3, '0')}`
}

/**
 * The scenes still to create: numbers 1…count whose slug the organisation
 * doesn't have yet, each with a short code unused anywhere (codes are global).
 */
export function planSceneBatch({ count, existingSlugs, existingCodes, makeCode = randomShortCode }) {
  const slugs = new Set(existingSlugs)
  const codes = new Set(existingCodes)
  const plan = []
  for (let n = 1; n <= count; n++) {
    const slug = sceneSlug(n)
    if (slugs.has(slug)) continue
    let code = makeCode()
    for (let tries = 0; codes.has(code); tries++) {
      if (tries > 100) throw new Error('Could not find an unused short code')
      code = makeCode()
    }
    codes.add(code)
    plan.push({ name: sceneName(n), slug, shortCode: code })
  }
  return plan
}

/** A cuid-shaped id, like the ones Prisma makes for new rows. */
export function newId(random = Math.random) {
  const body = Array.from({ length: 24 }, () => SHORT_CODE_CHARS[Math.floor(random() * SHORT_CODE_CHARS.length)]).join('')
  return `c${body}`
}
