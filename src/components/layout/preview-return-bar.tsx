'use client'

import { useSyncExternalStore } from 'react'
import { ArrowLeft } from 'lucide-react'

/** Where to go back to after previewing a scene as a visitor (set by the scene editor) */
export const PREVIEW_RETURN_KEY = 'hortlog-preview-return'

/**
 * While an editor previews visitor pages from the home-screen app, a bar at
 * the top takes them back to where they were editing.
 */
function readReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(PREVIEW_RETURN_KEY)
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null
  } catch {
    return null
  }
}

const noSubscribe = () => () => {}

export function PreviewReturnBar() {
  const back = useSyncExternalStore(noSubscribe, readReturnPath, () => null)

  if (!back) return null
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-primary px-4 py-2 text-sm text-primary-foreground pt-[max(0.5rem,env(safe-area-inset-top))]">
      <span className="min-w-0 truncate">Previewing as a visitor</span>
      <a
        href={back}
        onClick={() => {
          try {
            sessionStorage.removeItem(PREVIEW_RETURN_KEY)
          } catch {
            // Ignore
          }
        }}
        className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-primary-foreground px-3 font-medium text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to editing
      </a>
    </div>
  )
}
