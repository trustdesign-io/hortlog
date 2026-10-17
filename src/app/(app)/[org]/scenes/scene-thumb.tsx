'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'

/** A scene's bed photo, small; a camera when it has none yet (or it can't load). */
export function SceneThumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- private photo behind a signed link
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <Camera className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  )
}
