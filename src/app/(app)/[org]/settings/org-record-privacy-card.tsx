'use client'

import { useActionState } from 'react'
import { updateOrgRecordPrivacy } from '@/lib/actions/org'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionResult } from '@/lib/shared/types'

interface OrgRecordPrivacyCardProps {
  orgSlug: string
  recordsPublic: boolean
  privateRecordsShowName: boolean
}

const checkboxClass = 'mt-0.5 h-5 w-5 shrink-0 accent-primary'

export function OrgRecordPrivacyCard({ orgSlug, recordsPublic, privateRecordsShowName }: OrgRecordPrivacyCardProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    updateOrgRecordPrivacy.bind(null, orgSlug),
    null,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Members&apos; public records</CardTitle>
        <CardDescription>
          Members can make their own work record public. This decides whether plants worked with here appear on
          it. It doesn&apos;t affect your public specimen pages or QR codes.
        </CardDescription>
      </CardHeader>
      <form action={action} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-5">
          {state?.success === false && (
            <p className="text-sm text-destructive" role="alert">{state.error}</p>
          )}
          {state?.success === true && !isPending && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
              Saved.
            </p>
          )}
          <label className="flex items-start gap-3">
            <input type="checkbox" name="recordsPublic" defaultChecked={recordsPublic} disabled={isPending} className={checkboxClass} />
            <span className="text-sm">
              <span className="font-medium">Allow members to show our plants on their public records</span>
              <span className="block text-muted-foreground">
                Exact locations and grid references are never shown.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="privateRecordsShowName"
              defaultChecked={privateRecordsShowName}
              disabled={isPending}
              className={checkboxClass}
            />
            <span className="text-sm">
              <span className="font-medium">When not allowed, still name us</span>
              <span className="block text-muted-foreground">
                Records then show &ldquo;14 plants at your organisation (private collection)&rdquo;. Off shows
                &ldquo;14 plants at a private collection&rdquo;.
              </span>
            </span>
          </label>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
