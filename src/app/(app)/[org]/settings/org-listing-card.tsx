'use client'

import { useActionState } from 'react'
import { updateOrgListing } from '@/lib/actions/org'
import { Button } from '@/components/ui/button'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionResult } from '@/lib/shared/types'

interface OrgListingCardProps {
  orgSlug: string
  listed: boolean
  /** A garden made for one person: never listed */
  personal: boolean
}

/** Whether people can find this garden on hortlog and ask to join. */
export function OrgListingCard({ orgSlug, listed, personal }: OrgListingCardProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    updateOrgListing.bind(null, orgSlug),
    null,
  )
  const reason = 'This is a personal garden, so it’s never listed.'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Find a garden</CardTitle>
        <CardDescription>
          Signed-in people can search the gardens listed on hortlog and ask to join. You accept or decline each
          request on Team → Members. Unlisted, only people you invite can join.
        </CardDescription>
      </CardHeader>
      <form action={action} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-4">
          {state?.success === false && (
            <p className="text-sm text-destructive" role="alert">{state.error}</p>
          )}
          {state?.success === true && !isPending && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
              Saved.
            </p>
          )}
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="listed"
              defaultChecked={listed && !personal}
              disabled={isPending || personal}
              aria-describedby={personal ? 'listing-personal' : undefined}
              className="mt-0.5 h-5 w-5 shrink-0 accent-primary disabled:opacity-45"
            />
            <span className="text-sm">
              <span className="font-medium">List us in Find a garden</span>
              <span className="block text-muted-foreground">
                Shows our name, logo and postcode area (e.g. DA4), never the full postcode.
              </span>
              {personal && (
                <span id="listing-personal" className="block text-muted-foreground">
                  {reason}
                </span>
              )}
            </span>
          </label>
        </CardContent>
        <CardFooter>
          {personal ? (
            <UnavailableAction reason={reason} className={buttonVariants()}>
              Save
            </UnavailableAction>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
