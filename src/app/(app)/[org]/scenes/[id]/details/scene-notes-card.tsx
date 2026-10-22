'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { addSceneNote, removeSceneNote, updateSceneNote } from '@/lib/actions/scene-note'
import { cleanSceneNote, MAX_SCENE_NOTE, VISIBLE_SCENE_NOTES } from '@/lib/scene-notes'

export interface SceneNoteItem {
  id: string
  text: string
  /** ISO */
  createdAt: string
  author: string | null
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** Notes from the team, pinned to the scene for visitors. The demo keeps changes on the page. */
export function SceneNotesCard({ orgSlug, sceneId, notes: initial, demo = false }: { orgSlug: string; sceneId: string; notes: SceneNoteItem[]; demo?: boolean }) {
  const router = useRouter()
  const [notes, setNotes] = useState(initial)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save(action: () => Promise<{ success: boolean; error?: string }>, local: () => void) {
    setError(null)
    if (demo) return local()
    startTransition(async () => {
      const r = await action().catch(() => ({ success: false, error: 'That couldn’t be saved. Try again.' }))
      if (!r.success) return setError(r.error ?? 'That couldn’t be saved. Try again.')
      local()
      router.refresh()
    })
  }

  function add() {
    const text = cleanSceneNote(draft)
    if (!text) return setError(`Write a note of up to ${MAX_SCENE_NOTE} characters.`)
    save(
      () => addSceneNote(orgSlug, sceneId, text),
      () => {
        setNotes((n) => [{ id: `local-${Date.now()}`, text, createdAt: new Date().toISOString(), author: 'You' }, ...n])
        setDraft('')
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes from the team</CardTitle>
        <CardDescription>
          Short notes visitors read on this scene, like the chalkboards in a bed: what&rsquo;s special here, what
          you&rsquo;re working on, what to look out for. The newest {VISIBLE_SCENE_NOTES} show.
          {demo && ' In the demo they stay on this page.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="scene-note-new" className="sr-only">
            New note
          </label>
          <Textarea
            id="scene-note-new"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_SCENE_NOTE}
            rows={3}
            placeholder="e.g. Wild yams have long provided food for rural communities in Madagascar…"
            className="text-base"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {draft.length}/{MAX_SCENE_NOTE}
            </span>
            <Button type="button" onClick={add} disabled={isPending || draft.trim() === ''} className="min-h-11 sm:min-h-9">
              Add note
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {notes.length > 0 && (
          <ol className="divide-y rounded-lg border">
            {notes.map((n, i) => (
              <li key={n.id} className="space-y-2 p-3">
                {editing?.id === n.id ? (
                  <>
                    <label htmlFor={`scene-note-${n.id}`} className="sr-only">
                      Edit note
                    </label>
                    <Textarea
                      id={`scene-note-${n.id}`}
                      value={editing.text}
                      onChange={(e) => setEditing({ id: n.id, text: e.target.value })}
                      maxLength={MAX_SCENE_NOTE}
                      rows={3}
                      className="text-base"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() => {
                          const text = cleanSceneNote(editing.text)
                          if (!text) return setError(`Write a note of up to ${MAX_SCENE_NOTE} characters.`)
                          save(
                            () => updateSceneNote(orgSlug, n.id, text),
                            () => {
                              setNotes((all) => all.map((x) => (x.id === n.id ? { ...x, text } : x)))
                              setEditing(null)
                            },
                          )
                        }}
                      >
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-line text-sm">{n.text}</p>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {day(n.createdAt)}
                        {n.author && ` · ${n.author}`}
                        {i >= VISIBLE_SCENE_NOTES && ' · not shown to visitors (older)'}
                      </span>
                      <span className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit note" onClick={() => setEditing({ id: n.id, text: n.text })}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove note"
                          disabled={isPending}
                          onClick={() => save(() => removeSceneNote(orgSlug, n.id), () => setNotes((all) => all.filter((x) => x.id !== n.id)))}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </span>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
