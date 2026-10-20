'use client'

import { useEffect, useId, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Textarea } from '@/components/ui/textarea'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { reportLabelProblem } from '@/lib/actions/label-report'
import { LABEL_PROBLEM_LABELS, LABEL_PROBLEMS, MAX_LABEL_NOTE, type LabelProblemValue } from '@/lib/label-report'
import { cn } from '@/lib/utils'

interface LabelReportFormProps {
  orgSlug: string
  specimenId: string
  /** Visitors get a quiet link; members a button */
  audience: 'visitor' | 'member'
}

/** "Label missing or wrong?": tell the garden team, without signing in. */
export function LabelReportForm({ orgSlug, specimenId, audience }: LabelReportFormProps) {
  const router = useRouter()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [problem, setProblem] = useState<LabelProblemValue | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
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

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!problem) return setError('Choose what’s wrong with the label.')
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await reportLabelProblem(
        orgSlug,
        specimenId,
        problem,
        String(fd.get('note') ?? ''),
        String(fd.get('website') ?? ''),
      ).catch(() => ({ success: false as const, error: 'That couldn’t be sent. Try again.' }))
      if (!result.success) return setError(result.error)
      setSent(true)
      setOpen(false)
      if (audience === 'member') router.refresh()
    })
  }

  if (sent) {
    return (
      <p className="mt-6 border-t pt-6 text-sm text-muted-foreground" role="status">
        Thanks, the garden team will sort the label out.
      </p>
    )
  }

  if (!open) {
    return (
      <div className="mt-6 border-t pt-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className={
            audience === 'member'
              ? cn(buttonVariants({ variant: 'outline' }), 'min-h-11')
              : 'inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground'
          }
        >
          <Tag className="h-4 w-4" aria-hidden="true" />
          {audience === 'member' ? 'Report label problem' : 'Label missing or wrong?'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 border-t pt-6" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        What’s wrong with the label?
      </h2>
      <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <legend className="sr-only">Problem</legend>
        {LABEL_PROBLEMS.map((p) => (
          <label
            key={p}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              problem === p ? 'border-primary bg-primary/10 font-medium' : 'bg-card',
            )}
          >
            <input
              type="radio"
              name="problem"
              value={p}
              checked={problem === p}
              onChange={() => setProblem(p)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            {LABEL_PROBLEM_LABELS[p]}
          </label>
        ))}
      </fieldset>
      <div className="space-y-1">
        <label htmlFor={`${id}-note`} className="text-sm">
          Anything else? <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea id={`${id}-note`} name="note" maxLength={MAX_LABEL_NOTE} rows={2} className="text-base" />
        {audience === 'visitor' && (
          <p className="text-xs text-muted-foreground">Please don’t include your name or contact details.</p>
        )}
      </div>
      {/* For bots only */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        {online ? (
          <Button type="submit" disabled={isPending} className="min-h-11">
            {isPending ? 'Sending…' : 'Send'}
          </Button>
        ) : (
          <UnavailableAction reason="Sending needs a connection. Try again when you have signal." className={cn(buttonVariants(), 'min-h-11')}>
            Send
          </UnavailableAction>
        )}
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
