'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { setWorkLike } from '@/lib/actions/work-like'
import { cn } from '@/lib/utils'
import { likedByLine } from '@/lib/likes'

interface LikeButtonProps {
  entryId: string
  /** Everyone who liked it, by name; includes the viewer when `liked` */
  names: string[]
  liked: boolean
  viewerName: string
  /** Why the viewer can't like it (their own work); shown greyed out */
  unavailableReason?: string
}

/** A heart on a work entry: tap to like or unlike. Members of the same garden only. */
export function LikeButton({ entryId, names: initialNames, liked: initialLiked, viewerName, unavailableReason }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [names, setNames] = useState(initialNames)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const line = likedByLine(names)
  const heart = (on: boolean) => (
    <>
      <Heart className={cn('h-4 w-4', on && 'fill-current')} aria-hidden="true" />
      {names.length > 0 && <span className="tabular-nums">{names.length}</span>}
    </>
  )
  const buttonClass = 'inline-flex min-h-9 min-w-9 items-center gap-1 rounded-full px-2 text-xs'

  function toggle() {
    const next = !liked
    const before = { liked, names }
    setLiked(next)
    setNames(next ? [...names, viewerName] : names.filter((n) => n !== viewerName))
    setError(null)
    startTransition(async () => {
      const result = await setWorkLike(entryId, next).catch(() => ({ success: false as const, error: 'That couldn’t be saved. Try again.' }))
      if (!result.success) {
        setLiked(before.liked)
        setNames(before.names)
        setError(result.error)
      }
    })
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground print:hidden">
      {unavailableReason ? (
        <UnavailableAction reason={unavailableReason} label="Like" className={buttonClass}>
          {heart(false)}
        </UnavailableAction>
      ) : (
        <button
          type="button"
          onClick={toggle}
          disabled={isPending}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={cn(
            buttonClass,
            'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            liked ? 'text-pink-600 dark:text-pink-400' : 'text-muted-foreground',
          )}
        >
          {heart(liked)}
        </button>
      )}
      {line && <span>{line}</span>}
      {error && (
        <span className="text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
