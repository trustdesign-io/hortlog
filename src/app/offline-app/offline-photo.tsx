'use client'

import { useState } from 'react'
import { Leaf } from 'lucide-react'
import { offlineImageUrl } from '@/lib/offline/types'
import { cn } from '@/lib/utils'

/** A saved plant photo, or a leaf when there's none or it wasn't saved. */
export function Photo({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)} aria-hidden="true">
        <Leaf className="h-2/5 w-2/5" />
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the saved copy is the optimiser's output; next/image would ask for other sizes
    <img src={offlineImageUrl(src)} alt="" loading="lazy" onError={() => setFailed(true)} className={cn('object-cover', className)} />
  )
}
