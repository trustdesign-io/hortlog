import { Leaf } from 'lucide-react'
import { SceneSplashFade } from './scene-splash-fade'

/** Fired by the photo when it has loaded, so the opening screen can fade */
export const SCENE_READY_EVENT = 'hortlog-scene-ready'

/**
 * A moment of welcome when a visitor opens a scene: the garden's logo, fading into the page as soon as the photo is ready (never more than a
 * second and a half). Shown once per scene per visit.
 */
export function SceneSplash({ sceneId, logoUrl }: { sceneId: string; logoUrl: string | null }) {
  const id = `scene-splash-${sceneId}`
  return (
    <>
      <div
        id={id}
        aria-hidden="true"
        className="scene-splash fixed inset-0 z-[70] flex items-center justify-center bg-background"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- the garden's own logo
          <img src={logoUrl} alt="" className="h-24 w-24 rounded-full object-cover shadow-sm" />
        ) : (
          <Leaf className="h-12 w-12 text-primary" aria-hidden="true" />
        )}
      </div>
      <SceneSplashFade id={id} seenKey={`hortlog-splash-${sceneId}`} readyEvent={SCENE_READY_EVENT} />
    </>
  )
}
