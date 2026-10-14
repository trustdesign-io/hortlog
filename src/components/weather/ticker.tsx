'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * One line of text that never wraps. When it's wider than the space, it scrolls
 * sideways as a ticker (paused on hover/focus); with reduced motion it's cut
 * short with an ellipsis instead.
 */
export function Ticker({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const measure = () => {
      if (frame.current && line.current) setOverflowing(line.current.scrollWidth > frame.current.clientWidth + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (frame.current) observer.observe(frame.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frame} className="group relative min-w-0 flex-1 overflow-hidden whitespace-nowrap">
      {/* Measured copy: always present so the width can be checked; hidden once the ticker runs */}
      <span ref={line} className={overflowing ? 'invisible absolute' : 'block truncate'}>
        {children}
      </span>
      {overflowing && (
        <>
          <span className="block truncate motion-safe:hidden">{children}</span>
          <span
            aria-hidden="true"
            className="ticker-track hidden motion-safe:inline-flex group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          >
            <span className="pr-12">{children}</span>
            <span className="pr-12">{children}</span>
          </span>
          <span className="sr-only">{children}</span>
        </>
      )}
    </div>
  )
}
