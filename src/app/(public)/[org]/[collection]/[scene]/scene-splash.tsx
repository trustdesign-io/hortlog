import { Leaf } from 'lucide-react'
import { SceneSplashFade } from './scene-splash-fade'

/** Fired by the photo when it has loaded, so the opening screen can fade */
export const SCENE_READY_EVENT = 'hortlog-scene-ready'

/**
 * A moment of welcome when a visitor opens a scene: the garden and the scene's
 * name, fading into the page as soon as the photo is ready (never more than a
 * second and a half). Shown once per scene per visit.
 */
export function SceneSplash({ sceneId, garden, logoUrl, title }: { sceneId: string; garden: string; logoUrl: string | null; title: string }) {
  const id = `scene-splash-${sceneId}`
  return (
    <>
      <div
        id={id}
        aria-hidden="true"
        className="scene-splash fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-background px-8 text-center"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- the garden's own logo
          <img src={logoUrl} alt="" className="h-20 w-20 rounded-full object-cover shadow-sm" />
        ) : (
          <Leaf className="h-12 w-12 text-primary" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-primary">{garden}</p>
        <p className="font-heading text-3xl leading-tight text-balance">{title}</p>
      </div>
      <SceneSplashFade id={id} seenKey={`hortlog-splash-${sceneId}`} readyEvent={SCENE_READY_EVENT} />
    </>
  )
}
