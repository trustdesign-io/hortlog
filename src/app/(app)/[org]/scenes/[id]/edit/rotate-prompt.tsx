'use client'

import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * On phones held upright, asks for landscape: the grid needs the width. Shown by
 * CSS only (portrait + below md), so it disappears as soon as the phone turns.
 */
export function RotatePrompt() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-prompt-title"
      aria-describedby="rotate-prompt-description"
      className="fixed inset-0 z-50 hidden flex-col items-center justify-center gap-4 bg-background/95 px-8 text-center backdrop-blur-sm max-md:portrait:flex"
    >
      <Smartphone
        className="h-12 w-12 text-muted-foreground motion-safe:animate-[rotate-hint_2.4s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <h2 id="rotate-prompt-title" className="font-heading text-lg font-medium">
        Turn your phone sideways
      </h2>
      <p id="rotate-prompt-description" className="max-w-xs text-sm text-muted-foreground">
        The scene grid needs the extra width. Rotate to landscape to place specimens.
      </p>
      <Button variant="outline" size="sm" onClick={() => setDismissed(true)}>
        Continue in portrait
      </Button>
    </div>
  )
}
