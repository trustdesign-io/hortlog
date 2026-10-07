'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sendGAEvent } from '@next/third-parties/google'

interface QrRedirectProps {
  destination: string
  shortCode: string
}

export function QrRedirect({ destination, shortCode }: QrRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    sendGAEvent('event', 'qr_scan', { short_code: shortCode })
    router.replace(destination)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
