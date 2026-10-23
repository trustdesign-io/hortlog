'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { markSpecimenRemoved, restoreSpecimen } from '@/lib/actions/specimen'

interface SpecimenRemovedCardProps {
  orgSlug: string
  specimenId: string
  /** ISO, when it's already marked removed */
  removedAt: string | null
  removedNote: string | null
}

const today = () => new Date().toISOString().slice(0, 10)

/** Mark a plant as no longer in the garden, keeping its records; or put it back. */
export function SpecimenRemovedCard({ orgSlug, specimenId, removedAt, removedNote }: SpecimenRemovedCardProps) {
  const router = useRouter()
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action().catch(() => ({ success: false, error: 'That couldn’t be saved. Try again.' }))
      if (!result.success) setError(result.error ?? 'Try again.')
      else router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">No longer in the garden</CardTitle>
        <CardDescription>
          {removedAt
            ? `Removed ${new Date(removedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${removedNote ? ` — ${removedNote}` : ''}. It’s off the plant list, scenes, flowering pages and exports; its records stay.`
            : 'Died or taken out? Mark it removed: it comes off the plant list, its scene, flowering pages and exports, and everyone’s work records on it stay. Deleting it would delete those records too.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {removedAt ? (
          <Button type="button" variant="outline" disabled={isPending} onClick={() => run(() => restoreSpecimen(orgSlug, specimenId))}>
            {isPending ? 'Saving…' : 'Back in the garden'}
          </Button>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="removed-date">Date</Label>
                <Input id="removed-date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} disabled={isPending} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="removed-note">Why (optional)</Label>
                <Input
                  id="removed-note"
                  value={note}
                  maxLength={200}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Honey fungus"
                  disabled={isPending}
                />
              </div>
            </div>
            <Button type="button" variant="outline" disabled={isPending || !date} onClick={() => run(() => markSpecimenRemoved(orgSlug, specimenId, date, note))}>
              {isPending ? 'Saving…' : 'Mark as removed'}
            </Button>
          </>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
