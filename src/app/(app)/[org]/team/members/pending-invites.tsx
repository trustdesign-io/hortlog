'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MailWarning, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cancelInvite, resendInvite } from '@/lib/actions/member'
import { roleLabel, type RoleLabels } from '@/lib/roles'
import type { PendingInvite } from '@/lib/pending-invites'

const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/** Invites not yet accepted: who, when, and a fresh link if theirs expired or went to spam */
export function PendingInvites({ orgSlug, invites, labels }: { orgSlug: string; invites: PendingInvite[]; labels: RoleLabels }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null)
  const [, startTransition] = useTransition()

  function act(userId: string, kind: 'resend' | 'cancel', email: string) {
    setBusy(userId)
    setMessage(null)
    startTransition(async () => {
      const r = await (kind === 'resend' ? resendInvite(orgSlug, userId) : cancelInvite(orgSlug, userId)).catch(() => ({
        success: false as const,
        error: 'That didn’t work. Try again.',
      }))
      setBusy(null)
      setMessage(
        r.success
          ? { id: userId, ok: true, text: kind === 'resend' ? `New invite sent to ${email}.` : `Invite to ${email} cancelled.` }
          : { id: userId, ok: false, text: r.error },
      )
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invites waiting ({invites.length})</CardTitle>
        <CardDescription>
          People invited who haven&rsquo;t joined yet. Invite links last a day; resend one if it expired or went to spam
          (ask them to check their spam folder, and mark the email &ldquo;not spam&rdquo;).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && !invites.some((i) => i.userId === message.id) && (
          <p className={message.ok ? 'mb-3 text-sm text-primary' : 'mb-3 text-sm text-destructive'} role="status">
            {message.text}
          </p>
        )}
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invites waiting.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {invites.map((i) => (
              <li key={i.userId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.name ?? i.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.name && `${i.email} · `}
                    {roleLabel(i.role, labels)} · invited {when(i.invitedAt)}
                    {i.expired && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-300">
                        <MailWarning className="h-3 w-3" aria-hidden="true" /> link expired
                      </span>
                    )}
                  </p>
                  {message?.id === i.userId && (
                    <p className={message.ok ? 'mt-1 text-xs text-primary' : 'mt-1 text-xs text-destructive'} role="status">
                      {message.text}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant={i.expired ? 'default' : 'outline'} disabled={busy !== null} onClick={() => act(i.userId, 'resend', i.email)} className="min-h-9">
                    <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {busy === i.userId ? 'Sending…' : 'Resend'}
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" aria-label={`Cancel invite to ${i.email}`} disabled={busy !== null} onClick={() => act(i.userId, 'cancel', i.email)} className="h-9 w-9">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
