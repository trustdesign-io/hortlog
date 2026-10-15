'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'
import { hexGridExtent } from '@/lib/hex-grid'
import { sceneCellScale, sceneTilt, type ScenePerspective } from '@/lib/scene-perspective'

/** Cells are never drawn narrower than this, however big the grid. */
const MIN_CELL_PX = 28
/** Space kept clear under the grid. */
const BOTTOM_GAP_PX = 16

/**
 * Cell width and tilt that fit the whole grid in `width` × `height` pixels,
 * never larger than `usualPx`. The bed tilt depends on cell size, so it's
 * worked out from a first fit, then the fit is redone at that tilt.
 */
export function fitGrid(
  rows: number,
  cols: number,
  perspective: ScenePerspective,
  width: number,
  height: number,
  usualPx: number,
): { cellPx: number; tilt: number } {
  const fit = (tilt: number) => {
    const extent = hexGridExtent(rows, cols, tilt)
    const usual = usualPx * sceneCellScale(rows, tilt)
    return Math.max(MIN_CELL_PX, Math.min(usual, width / extent.width, height / extent.height))
  }
  const first = fit(sceneTilt(perspective, rows, usualPx))
  const tilt = sceneTilt(perspective, rows, first)
  return { cellPx: Math.floor(fit(tilt)), tilt }
}

/**
 * Fits a scene's grid to the space left on screen below `box`, so it shows
 * whole without scrolling, even on a phone held upright. Null until measured.
 */
export function useFittedGrid(
  box: RefObject<HTMLElement | null>,
  rows: number,
  cols: number,
  perspective: ScenePerspective,
  usualPx: number,
): { cellPx: number; tilt: number } | null {
  const [fitted, setFitted] = useState<{ cellPx: number; tilt: number } | null>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      const height = window.innerHeight - top - BOTTOM_GAP_PX
      setFitted(fitGrid(rows, cols, perspective, el.clientWidth, Math.max(height, 200), usualPx))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [box, rows, cols, perspective, usualPx])

  return fitted
}

/** Before measuring: the usual size, squeezed to the screen's width. */
export function unmeasuredCellWidth(rows: number, cols: number, tilt: number, usualRem: number): string {
  return `min(${usualRem * sceneCellScale(rows, tilt)}rem, calc((100vw - 2rem) / ${hexGridExtent(rows, cols, tilt).width}))`
}
