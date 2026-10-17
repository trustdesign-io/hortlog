'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ScientificName } from '@/components/ui/scientific-name'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { cn } from '@/lib/utils'

export interface ScenePlant {
  /** Its number on the photo, if it's marked there */
  number: number | null
  slug: string
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
  /** Where it is in the photo, 0–1 from the left and top */
  x: number | null
  y: number | null
}

interface BedPhotoViewProps {
  photoUrl: string
  /** Marked plants first, in number order */
  plants: ScenePlant[]
  basePath: string
}

/**
 * The scene as the visitor sees it: the photo with a number on each plant, and
 * the plants as a row of cards to swipe through. The two move together:
 * tapping a number brings its card into view, swiping lights up its number.
 */
export function BedPhotoView({ photoUrl, plants, basePath }: BedPhotoViewProps) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const [active, setActive] = useState(0)
  const track = useRef<HTMLUListElement>(null)
  const cards = useRef<(HTMLLIElement | null)[]>([])
  // Set while a tap is scrolling the row, so the scroll doesn't fight it
  const steering = useRef<number | null>(null)

  // Swiping: the card nearest the row's left edge is the current one
  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const left = el.getBoundingClientRect().left
        let best = 0
        let bestDist = Infinity
        cards.current.forEach((c, i) => {
          if (!c) return
          const d = Math.abs(c.getBoundingClientRect().left - left)
          if (d < bestDist) {
            bestDist = d
            best = i
          }
        })
        if (steering.current !== null) {
          if (best === steering.current) steering.current = null
          return
        }
        setActive(best)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  function go(i: number) {
    const target = Math.max(0, Math.min(plants.length - 1, i))
    const el = track.current
    const card = cards.current[target]
    if (!el || !card) return
    setActive(target)
    steering.current = target
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
    // In case the row can't scroll that far (the last cards), stop steering anyway
    window.setTimeout(() => {
      if (steering.current === target) steering.current = null
    }, 700)
  }

  const current = plants[active]
  const marked = plants.filter((p) => p.number !== null && p.x !== null && p.y !== null)

  return (
    <div className="space-y-5">
      {!photoFailed && (
        <div className="relative -mx-4 overflow-hidden bg-muted sm:mx-0 sm:rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- photo behind a signed link */}
          <img src={photoUrl} alt="The scene in front of you" className="block h-auto w-full" onError={() => setPhotoFailed(true)} />
          {marked.map((p) => {
            const i = plants.indexOf(p)
            const on = i === active
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => go(i)}
                aria-pressed={on}
                aria-label={`${p.number}: ${p.commonName}`}
                className={cn(
                  'absolute flex h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 px-1.5 text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70',
                  on ? 'z-10 scale-125 border-white bg-primary text-primary-foreground' : 'border-white/90 bg-white/90 text-[#16201A]',
                )}
                style={{ left: `${(p.x as number) * 100}%`, top: `${(p.y as number) * 100}%` }}
              >
                {p.number}
              </button>
            )
          })}
        </div>
      )}

      <section aria-labelledby="plants-here" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 id="plants-here" className="font-heading text-xl">
            Plants here
          </h2>
          {plants.length > 1 && (
            <div className="flex items-center gap-1">
              <span className="mr-1 text-sm tabular-nums text-muted-foreground" aria-live="polite">
                {active + 1} of {plants.length}
              </span>
              <button
                type="button"
                onClick={() => go(active - 1)}
                disabled={active === 0}
                aria-label="Previous plant"
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(active + 1)}
                disabled={active === plants.length - 1}
                aria-label="Next plant"
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <ul
          ref={track}
          role="list"
          aria-label={current ? `Plants here, showing ${current.commonName}` : 'Plants here'}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0"
        >
          {plants.map((p, i) => (
            <li
              key={p.slug}
              ref={(el) => {
                cards.current[i] = el
              }}
              className="w-[78%] shrink-0 snap-start sm:w-[46%]"
            >
              <Link
                href={`${basePath}/${p.slug}`}
                className={cn(
                  'group block overflow-hidden rounded-2xl border bg-card shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  i === active && 'border-primary shadow-md',
                )}
              >
                <span className="relative block aspect-[4/3] bg-muted">
                  <SpecimenImage
                    imageUrl={p.thumbnailUrl}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 320px, 78vw"
                    className="object-cover transition-transform group-hover:scale-[1.03]"
                  />
                  {p.number !== null && (
                    <span
                      className={cn(
                        'absolute left-3 top-3 flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-sm font-semibold shadow',
                        i === active ? 'bg-primary text-primary-foreground' : 'bg-white/90 text-[#16201A]',
                      )}
                      aria-hidden="true"
                    >
                      {p.number}
                    </span>
                  )}
                </span>
                <span className="flex items-end justify-between gap-2 p-4">
                  <span className="min-w-0">
                    <span className="block font-heading text-lg leading-tight">
                      {p.number !== null && <span className="sr-only">{p.number}: </span>}
                      {p.commonName}
                    </span>
                    <ScientificName className="block text-sm text-muted-foreground">{p.scientificName}</ScientificName>
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary">
                    Discover
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
