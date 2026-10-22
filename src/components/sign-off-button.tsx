'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { signOffEntry } from '@/lib/actions/supervision'
import { MAX_SIGN_OFF_COMMENT } from '@/lib/supervision'

/** For a supervisor: sign off a trainee's entry, with an optional comment, or take it back */
export function SignOffButton({ entryId, signed }: { entryId: string; signed: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function send(next: boolean) {
    setError(null)
    startTransition(async () => {
      const r = await signOffEntry(entryId, next, comment).catch(() => ({ success: false as const, error: 'That couldn’t be saved. Try again.' }))
      if (!r.success) return setError(r.error)
      setOpen(false)
      setComment('')
      router.refresh()
    })
  }

  if (signed) {
    return (
      <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => send(false)}>
        Undo sign-off
      </Button>
    )
  }
  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="min-h-9" onClick={() => setOpen(true)}>
        <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
        Sign off
      </Button>
    )
  }
  return (
    <div className="w-full space-y-2">
      <label htmlFor={`signoff-${entryId}`} className="text-xs text-muted-foreground">
        Comment (optional)
      </label>
      <Textarea id={`signoff-${entryId}`} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={MAX_SIGN_OFF_COMMENT} rows={2} className="text-base" />
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={isPending} onClick={() => send(true)}>
          Sign off
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
