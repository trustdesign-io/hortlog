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
  // Runs before the page is shown: skip the screen if this scene was opened already this visit
  const script = `try{var k=${JSON.stringify(`hortlog-splash-${sceneId}`)};if(sessionStorage.getItem(k)){var e=document.getElementById(${JSON.stringify(id)});e&&e.remove()}else{sessionStorage.setItem(k,'1')}}catch(e){}`
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
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <SceneSplashFade id={id} readyEvent={SCENE_READY_EVENT} />
    </>
  )
}
