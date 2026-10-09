'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createShareLink, revokeShareLink } from '@/lib/actions/work-record-share'

interface ShareControlsProps {
  recordId: string
  shareToken: string | null
}

export function ShareControls({ recordId, shareToken: initialToken }: ShareControlsProps) {
  const [token, setToken] = useState(initialToken)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const result = await createShareLink(recordId)
      if (result.success && result.data) {
        setToken(result.data.token)
      }
    })
  }

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeShareLink(recordId)
      if (result.success) setToken(null)
    })
  }

  const shareUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${token}`
    : null

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-sm font-medium">Share with employers</h2>
      {token ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            Anyone with this link can view your record (read-only, no personal data shown).
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
              {shareUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => shareUrl && navigator.clipboard.writeText(shareUrl)}
              type="button"
            >
              Copy
            </Button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending}
            type="button"
          >
            {isPending ? 'Revoking…' : 'Revoke link'}
          </Button>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">
            Off by default. Generate a link to share your record anonymously.
          </p>
          <Button
            size="sm"
            className="mt-2"
            onClick={handleCreate}
            disabled={isPending}
            type="button"
          >
            {isPending ? 'Generating…' : 'Create share link'}
          </Button>
        </div>
      )}
    </div>
  )
}
