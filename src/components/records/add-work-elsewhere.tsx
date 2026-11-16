'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { addWorkElsewhere } from '@/lib/actions/record-elsewhere'
import { MAX_SITE_NAME } from '@/lib/record-elsewhere'
import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { SpeciesPicker, type PickedSpecies } from '@/components/species/species-picker'

const fieldClass =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:h-9 sm:text-sm'

interface AddWorkElsewhereProps {
  /** Sites already used for work elsewhere, offered as you type */
  sites: string[]
}

/** Record work on a plant at a site that isn't a garden on hortlog. */
export function AddWorkElsewhere({ sites }: AddWorkElsewhereProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [species, setSpecies] = useState<PickedSpecies | null>(null)
  const [action, setAction] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!species) {
      setError('Choose the plant from the list.')
      return
    }
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addWorkElsewhere({
        speciesId: species.id,
        site: String(form.get('site') ?? ''),
        date: String(form.get('date') ?? ''),
        action,
        actionNote: String(form.get('actionNote') ?? ''),
        text: String(form.get('text') ?? ''),
      })
      if (!res.success) {
        setError(res.error)
        return
      }
      setOpen(false)
      setSpecies(null)
      setAction('')
      if (res.recordId) router.push(`/records/${res.recordId}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-11 sm:h-9">
            <MapPin className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add a plant worked elsewhere
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>A plant worked elsewhere</DialogTitle>
          <DialogDescription>
            For work at a site that isn’t a garden on hortlog. Work on the same plant at the same site again adds to its record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" aria-busy={isPending}>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="elsewhere-species">Plant</Label>
            <SpeciesPicker id="elsewhere-species" value={species} onChange={setSpecies} disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="elsewhere-site">Site</Label>
            <input
              id="elsewhere-site"
              name="site"
              list="elsewhere-sites"
              required
              maxLength={MAX_SITE_NAME}
              placeholder="e.g. Riverview Academy"
              disabled={isPending}
              className={fieldClass}
            />
            <datalist id="elsewhere-sites">
              {sites.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="elsewhere-date">Date</Label>
            <input
              type="date"
              id="elsewhere-date"
              name="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              disabled={isPending}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="elsewhere-action">What you did</Label>
            <NativeSelect
              id="elsewhere-action"
              required
              value={action}
              onChange={(e) => setAction(e.target.value)}
              disabled={isPending}
            >
              <option value="">Select an action…</option>
              {Object.entries(WORK_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="elsewhere-action-note">{action === 'OTHER' ? 'Say what you did' : 'Notes on action'}</Label>
            <Textarea
              id="elsewhere-action-note"
              name="actionNote"
              rows={2}
              required={action === 'OTHER'}
              placeholder="What specifically was done?"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="elsewhere-text">Notes</Label>
            <Textarea id="elsewhere-text" name="text" rows={3} disabled={isPending} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="h-11 sm:h-9">
              {isPending ? 'Adding…' : 'Add to my record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
