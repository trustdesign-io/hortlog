'use client'

import { useMemo, useState } from 'react'
import { PhotoSceneEditor } from '@/components/scene-editor/photo-scene-editor'
import type { OutboxOp, SyncOpInput } from '@/lib/offline/ops'
import { applyPending } from '@/lib/offline/pending'
import type { OrgSnapshot } from '@/lib/offline/types'

/** The real scene editor, with changes kept on the page instead of sent to hortlog */
export function DemoSceneEditor({ snap, sceneId, photoUrl }: { snap: OrgSnapshot; sceneId: string; photoUrl: string }) {
  const [ops, setOps] = useState<OutboxOp[]>([])
  const view = useMemo(() => {
    const v = applyPending(snap, ops)
    // Nothing is waiting to send in the demo: show changes as done
    return { ...v, specimens: v.specimens.map((s) => ({ ...s, pending: false })) }
  }, [snap, ops])
  const scene = view.scenes.find((s) => s.id === sceneId)
  if (!scene) return null

  return (
    <PhotoSceneEditor
      snap={view}
      scene={{ ...scene, pending: false }}
      onQueue={(list: SyncOpInput[]) => setOps((prev) => [...prev, ...list])}
      demo={{ photoUrl }}
    />
  )
}
