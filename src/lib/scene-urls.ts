/**
 * Public address of a scene. Scenes with a primary collection live under it;
 * scenes without one live at /[org]/scene/[slug].
 */
export function publicScenePath(orgSlug: string, sceneSlug: string, collectionSlug: string | null): string {
  return collectionSlug ? `/${orgSlug}/${collectionSlug}/${sceneSlug}` : `/${orgSlug}/scene/${sceneSlug}`
}
