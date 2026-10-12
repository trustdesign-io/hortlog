'use client'

import { useActionState } from 'react'
import { updatePlantCredit } from '@/lib/actions/account'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionResult } from '@/lib/shared/types'

interface PlantCreditCardProps {
  creditOnPlants: boolean
}

export function PlantCreditCard({ creditOnPlants }: PlantCreditCardProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(updatePlantCredit, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plant pages</CardTitle>
        <CardDescription>
          Visitors see the latest care on each plant&apos;s public page, such as &ldquo;Pruned, 17 May&rdquo;.
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
              name="creditOnPlants"
              defaultChecked={creditOnPlants}
              disabled={isPending}
              className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
            />
            <span className="text-sm">
              <span className="font-medium">Credit me on plant pages</span>
              <span className="block text-muted-foreground">
                Adds your name to the care you log, linked to your public record if you have one. Your notes are
                never shown. Off by default.
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
