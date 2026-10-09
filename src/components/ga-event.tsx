'use client'

import { useEffect } from 'react'
import { sendGAEvent } from '@next/third-parties/google'
import { getConsentChoice } from '@/lib/cookies/consent'

interface GaEventProps {
  name: string
  params?: Record<string, string | number | boolean>
}

/** Fire a single GA4 custom event on mount, only if analytics consent has been granted. */
export function GaEvent({ name, params = {} }: GaEventProps) {
  useEffect(() => {
    if (getConsentChoice() !== 'accepted') return
    sendGAEvent('event', name, params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
