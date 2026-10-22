'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WHATS_NEW, WHATS_NEW_SEEN_KEY, WHATS_NEW_UPDATE_ID } from '@/lib/whats-new'

/**
 * "What's new": opens by itself once per update, then stays closed until the
 * next; the link beside Sign in opens it again.
 */
export function WhatsNew() {
  const [open, setOpen] = useState(false)

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
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sparkles className="h-4 w-4 text-tertiary" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">What&rsquo;s new</span>
      </button>
      <Dialog open={open} onOpenChange={change}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">What&rsquo;s new in hortlog</DialogTitle>
            <DialogDescription>The latest improvements for gardens, their teams and their visitors.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {WHATS_NEW.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tertiary" aria-hidden="true" />
                <span className="text-sm">
                  <span className="font-medium">{item.title}.</span>{' '}
                  <span className="text-muted-foreground">{item.text}</span>
                  {item.href && (
                    <>
                      {' '}
                      <Link href={item.href} onClick={() => change(false)} className="font-medium text-primary underline underline-offset-2">
                        Try it
                      </Link>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <Button type="button" className="mt-2 w-full sm:w-auto" onClick={() => change(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
