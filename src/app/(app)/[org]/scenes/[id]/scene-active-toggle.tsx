'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { setSceneActive } from '@/lib/actions/scene'

/** Whether the scene is in use at the venue. */
export function SceneActiveToggle({ orgSlug, sceneId, active }: { orgSlug: string; sceneId: string; active: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [on, setOn] = useState(active)
  const [error, setError] = useState<string | null>(null)

  function change(next: boolean) {
    setOn(next)
    setError(null)
    startTransition(async () => {
      const result = await setSceneActive(orgSlug, sceneId, next)
      if (result.success) router.refresh()
      else {
        setOn(!next)
        setError(result.error ?? 'Could not save.')
      }
    })
  }

  return (
    <div className="space-y-1">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <Switch checked={on} onCheckedChange={change} disabled={isPending} aria-describedby={`active-${sceneId}`} />
        <span className="font-medium">{on ? 'Active' : 'Inactive'}</span>
      </label>
      <p id={`active-${sceneId}`} className="text-xs text-muted-foreground">
        {on ? 'In use at the venue and counted.' : 'Not in use yet: hidden from visitors and counts.'}
      </p>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
