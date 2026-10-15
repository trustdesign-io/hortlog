'use client'

import { usePathname } from 'next/navigation'
import { CloudOff } from 'lucide-react'
import { offlineAppHref } from '@/lib/offline/routes'
import { cn } from '@/lib/utils'

/**
 * Opens the copy saved on this device, for weak signal: changes there are
 * kept on the phone and sent when the connection is good again.
 */
export function WorkOfflineLink({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <a href={offlineAppHref(pathname)} className={cn('inline-flex items-center gap-1.5 underline-offset-2 hover:underline', className)}>
      <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
      Work offline
    </a>
  )
}
