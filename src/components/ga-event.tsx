'use client'

import { useEffect } from 'react'
import { sendGAEvent } from '@next/third-parties/google'

interface GaEventProps {
  name: string
  params?: Record<string, string>
}

/** Fire a single GA4 custom event on mount. */
export function GaEvent({ name, params = {} }: GaEventProps) {
  useEffect(() => {
    sendGAEvent('event', name, params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
