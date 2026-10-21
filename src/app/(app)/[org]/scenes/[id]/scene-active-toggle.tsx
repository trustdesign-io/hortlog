'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { setSceneActive } from '@/lib/actions/scene'

/** Whether the scene is in use at the venue. */
export function SceneActiveToggle({ orgSlug, sceneId, active, demo = false }: { orgSlug: string; sceneId: string; active: boolean; demo?: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [on, setOn] = useState(active)
  const [error, setError] = useState<string | null>(null)

  function change(next: boolean) {
    setOn(next)
    setError(null)
    // The demo only flips the switch: nothing is saved
    if (demo) return
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
        <Switch checked={on} onCheckedChange={change} disabled={isPending} />
        <span className="font-medium">{on ? 'Active' : 'Inactive'}</span>
      </label>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
