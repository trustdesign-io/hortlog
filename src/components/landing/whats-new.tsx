'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WHATS_NEW, WHATS_NEW_SEEN_KEY, WHATS_NEW_UPDATE_ID } from '@/lib/whats-new'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/layout/logo'

/**
 * "What's new": opens by itself once per update, then stays closed until the
 * next; the link beside Sign in opens it again. One improvement at a time, so
 * it stays small and doesn't cover the page: swipe or use the arrows.
 */
export function WhatsNew() {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const swipeFrom = useRef<number | null>(null)
  const last = WHATS_NEW.length - 1
  const item = WHATS_NEW[index]
  const go = (to: number) => setIndex(Math.max(0, Math.min(last, to)))

  useEffect(() => {
    let seen: string | null = null
    try {
      seen = localStorage.getItem(WHATS_NEW_SEEN_KEY)
    } catch {
      // Without storage it would open every visit: leave it to the link
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (seen !== WHATS_NEW_UPDATE_ID) setOpen(true)
  }, [])

  function change(next: boolean) {
    if (next) setIndex(0)
    setOpen(next)
    if (!next) {
      try {
        localStorage.setItem(WHATS_NEW_SEEN_KEY, WHATS_NEW_UPDATE_ID)
      } catch {
        // Fine: it just may open again next time
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => change(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sparkles className="h-4 w-4 text-tertiary" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">What&rsquo;s new</span>
      </button>
      <Dialog open={open} onOpenChange={change}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {/* It covers the page header, so it carries the logo itself */}
            <div className="pb-1" onClickCapture={() => change(false)}>
              <Logo />
            </div>
            <DialogTitle className="font-heading text-xl">What&rsquo;s new in hortlog</DialogTitle>
            <DialogDescription>The latest improvements for gardens, their teams and their visitors.</DialogDescription>
          </DialogHeader>
          <div
            role="group"
            aria-roledescription="carousel"
            aria-label="Improvements"
            className="touch-pan-y select-none rounded-lg border bg-card p-4"
            onPointerDown={(e) => {
              swipeFrom.current = e.clientX
            }}
            onPointerUp={(e) => {
              if (swipeFrom.current === null) return
              const moved = e.clientX - swipeFrom.current
              swipeFrom.current = null
              if (Math.abs(moved) > 40) go(index + (moved < 0 ? 1 : -1))
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') go(index + 1)
              if (e.key === 'ArrowLeft') go(index - 1)
            }}
          >
            <div aria-live="polite" aria-atomic="true" className="min-h-28">
              <p className="text-xs text-muted-foreground">
                {index + 1} of {WHATS_NEW.length}
              </p>
              <p className="mt-1 font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.text}
                {item.href && (
                  <>
                    {' '}
                    <Link href={item.href} onClick={() => change(false)} className="font-medium text-primary underline underline-offset-2">
                      Try it
                    </Link>
                  </>
                )}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="icon" aria-label="Previous" disabled={index === 0} onClick={() => go(index - 1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="flex flex-wrap justify-center gap-1.5">
                {WHATS_NEW.map((w, i) => (
                  <button
                    key={w.title}
                    type="button"
                    aria-label={`${i + 1}: ${w.title}`}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => go(i)}
                    className="flex h-6 w-4 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={cn('h-2 w-2 rounded-full', i === index ? 'bg-tertiary' : 'bg-muted-foreground/30')} />
                  </button>
                ))}
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Next" disabled={index === last} onClick={() => go(index + 1)}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={() => change(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
