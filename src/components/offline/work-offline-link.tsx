'use client'

import { useEffect, useState } from 'react'
import { CloudOff } from 'lucide-react'
import { listOutbox, listSnapshots, offlineStoreAvailable } from '@/lib/offline/db'
import { isUnsent } from '@/lib/offline/ops'
import { offlineAppHref } from '@/lib/offline/routes'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button-variants'

/**
 * On the sign-in page: if this phone has a saved copy, open it instead of
 * signing in, since signing in needs a connection. Changes made there wait
 * on the device until the member signs in again.
 */
export function WorkOfflineLink({ className }: { className?: string }) {
  const [saved, setSaved] = useState<{ unsent: number } | null>(null)

  useEffect(() => {
    if (!offlineStoreAvailable()) return
    let cancelled = false
    void Promise.all([listSnapshots(), listOutbox()])
      .then(([snapshots, ops]) => {
        if (!cancelled && snapshots.length > 0) setSaved({ unsent: ops.filter(isUnsent).length })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!saved) return null
  return (
    <div className={cn('flex flex-col gap-2.5 rounded-xl border bg-card p-3 text-sm', className)}>
      <p className="flex items-start gap-2 text-muted-foreground">
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          No signal? This phone has a saved copy you can work in.
          {saved.unsent > 0
            ? ` ${saved.unsent} change${saved.unsent === 1 ? '' : 's'} will be sent once you sign in.`
            : ' Changes are sent once you sign in.'}
        </span>
      </p>
      <a href={offlineAppHref('/records')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}>
        Work offline
      </a>
    </div>
  )
}
