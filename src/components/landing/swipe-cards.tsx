'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SwipeCardsProps {
  /** Accessible name for the scrollable region */
  label: string
  items: ReactNode[]
  /** Layout from `sm` up, e.g. 'sm:grid sm:grid-cols-3 sm:gap-8' */
  gridClassName: string
  /** Extra classes for every item */
  itemClassName?: string
}

/** Matches the scroller's side padding (px-6), which snapped cards align to. */
const INSET_PX = 24

/**
 * On phones, a row of cards that swipe and snap into place, with dots showing
 * which card is in view. From `sm` up the same items lay out as a grid.
 */
export function SwipeCards({ label, items, gridClassName, itemClassName }: SwipeCardsProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const cards = useRef<Array<HTMLLIElement | null>>([])
  const [active, setActive] = useState(0)

  const onScroll = useCallback(() => {
    const el = scroller.current
    if (!el) return
    // At the far end the last card can't reach the snap point, so count it as reached
    if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
      setActive(items.length - 1)
      return
    }
    let nearest = 0
    let best = Infinity
    cards.current.forEach((card, i) => {
      if (!card) return
      const distance = Math.abs(card.offsetLeft - INSET_PX - el.scrollLeft)
      if (distance < best) {
        best = distance
        nearest = i
      }
    })
    setActive(nearest)
  }, [items.length])

  function goTo(i: number) {
    const el = scroller.current
    const card = cards.current[i]
    if (!el || !card) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: card.offsetLeft - INSET_PX, behavior: smooth ? 'smooth' : 'auto' })
  }

  return (
    <div>
      <div
        ref={scroller}
        onScroll={onScroll}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="relative -mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        <ul role="list" className={cn('flex snap-x snap-mandatory scroll-px-6 gap-4', gridClassName)}>
          {items.map((item, i) => (
            <li
              key={i}
              ref={(el) => {
                cards.current[i] = el
              }}
              className={cn(
                'flex w-[78%] shrink-0 snap-start flex-col rounded-xl border bg-background p-5 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0',
                itemClassName,
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex justify-center sm:hidden">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show card ${i + 1} of ${items.length}`}
            aria-current={i === active ? 'true' : undefined}
            className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                'block h-2 rounded-full transition-all',
                i === active ? 'w-4 bg-primary' : 'w-2 bg-muted-foreground/40',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
