'use client'

import { useActionState, useState, useTransition } from 'react'
import { Check, Copy, Trash2 } from 'lucide-react'
import { createApiKeyAction, deleteApiKeyAction } from '@/lib/actions/api-keys'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/lib/shared/types'

export interface ApiKeySummary {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** Keys that let Claude on the member's computer lay out scenes from bed photos. */
export function ApiKeysCard({ keys }: { keys: ApiKeySummary[] }) {
  const [state, action, isPending] = useActionState<ActionResult<{ key: string }> | null, FormData>(createApiKeyAction, null)
  const [copied, setCopied] = useState(false)
  const [deleting, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const newKey = state?.success ? state.data?.key : null
  const endpoint = typeof window === 'undefined' ? '/api/claude/scenes' : `${window.location.origin}/api/claude/scenes`
  const prompt = newKey
    ? `Process my hortlog scenes. Fetch ${endpoint} with the header "Authorization: Bearer ${newKey}" and follow the guide it returns.`
    : ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the text is on screen to copy by hand
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keys for Claude</CardTitle>
        <CardDescription>
          Let Claude on your computer lay out scenes from their bed photos. A key acts as you, so keep it to yourself.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {newKey ? (
          <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3" role="status">
            <p className="text-sm font-medium">Your key is ready. Copy this and give it to Claude:</p>
            <p className="break-all rounded-md bg-muted p-2 font-mono text-xs">{prompt}</p>
            <Button type="button" size="sm" variant="outline" onClick={copy} className="w-full sm:w-auto">
              {copied ? <Check className="mr-1.5 h-4 w-4" aria-hidden="true" /> : <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <p className="text-xs text-muted-foreground">You won&rsquo;t see the key again. If you lose it, delete it and make another.</p>
          </div>
        ) : (
          <form action={action} aria-busy={isPending} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="api-key-name">Name</Label>
              <Input id="api-key-name" name="name" placeholder="Claude on my Mac" maxLength={60} />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Making…' : 'Make a key'}
            </Button>
          </form>
        )}
        {state?.success === false && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        {deleteError && (
          <p className="text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        )}
        {keys.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{k.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="font-mono">{k.prefix}…</span> · made {day(k.createdAt)}
                    {k.lastUsedAt ? ` · last used ${day(k.lastUsedAt)}` : ' · not used yet'}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deleting}
                  onClick={() =>
                    startDelete(async () => {
                      const r = await deleteApiKeyAction(k.id)
                      setDeleteError(r.success ? null : r.error)
                    })
                  }
                  aria-label={`Delete key ${k.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
