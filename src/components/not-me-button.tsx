'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { removeMeFromEntry } from '@/lib/actions/work-record'

/** Take yourself off work someone else tagged you on */
export function NotMeButton({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex shrink-0 flex-col items-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await removeMeFromEntry(entryId)
            if (!result.success) setError(result.error ?? 'Try again.')
            else router.refresh()
          })
        }
      >
        {isPending ? 'Removing…' : 'Not me'}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
