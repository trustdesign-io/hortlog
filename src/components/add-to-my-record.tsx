'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { addTaggedWorkToMyRecord } from '@/lib/actions/work-record'

interface AddToMyRecordProps {
  entryId: string
  /** Your record holding your copy, once you've added it */
  recordId: string | null
}

/** Work someone tagged you on: add it to your own record without typing it again. */
export function AddToMyRecord({ entryId, recordId: initialRecordId }: AddToMyRecordProps) {
  const router = useRouter()
  const [recordId, setRecordId] = useState(initialRecordId)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (recordId) {
    return (
      <Link
        href={`/records/${recordId}`}
        className="inline-flex min-h-8 shrink-0 items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        In your record
      </Link>
    )
  }

  const content = (
    <>
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      {isPending ? 'Adding…' : 'Add to my record'}
    </>
  )

  return (
    <div className="flex shrink-0 flex-col items-end">
      {online ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              const result = await addTaggedWorkToMyRecord(entryId).catch(() => ({
                success: false as const,
                error: 'That couldn’t be added. Try again.',
                recordId: undefined,
              }))
              if (!result.success) {
                setError(result.error ?? 'Try again.')
                return
              }
              setRecordId(result.recordId ?? null)
              router.refresh()
            })
          }
        >
          {content}
        </Button>
      ) : (
        <UnavailableAction
          reason="You’re offline. Add it to your record when you’re back online."
          className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-sm"
        >
          {content}
        </UnavailableAction>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
