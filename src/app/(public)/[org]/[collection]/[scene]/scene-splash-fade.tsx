'use client'

import { useEffect } from 'react'

/** Shortest time the opening screen shows, so it reads as a welcome rather than a flicker */
const MIN_MS = 600

/** Fades the opening screen once the scene's photo is ready (CSS hides it regardless after 1.5 s). */
export function SceneSplashFade({ id, seenKey, readyEvent }: { id: string; seenKey: string; readyEvent: string }) {
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el) return
    // Once per scene per visit (a full reload is handled before drawing, in the root layout)
    try {
      if (sessionStorage.getItem(seenKey)) {
        el.style.display = 'none'
        return
      }
      sessionStorage.setItem(seenKey, '1')
    } catch {
      // No session storage: show it each time
    }
    const shownAt = performance.now()
    let timer = 0
    const fade = () => {
      timer = window.setTimeout(() => el.classList.add('scene-splash-done'), Math.max(0, MIN_MS - (performance.now() - shownAt)))
    }
    // No photo on the page, or it loaded before this ran: nothing to wait for
    const photo = document.querySelector<HTMLImageElement>('img[data-scene-photo]')
    if (!photo || photo.complete) fade()
    else window.addEventListener(readyEvent, fade, { once: true })
    return () => {
      window.removeEventListener(readyEvent, fade)
      window.clearTimeout(timer)
    }
  }, [id, seenKey, readyEvent])
  return null
}
