'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PhotoSceneEditor } from '@/components/scene-editor/photo-scene-editor'
import { newOpId, opTime, type SyncOpInput } from '@/lib/offline/ops'
import { queueOp } from '@/lib/offline/sync'
import type { OfflineScene, OrgSnapshot } from '@/lib/offline/types'
import { MAX_SCENE_TITLE } from '@/lib/scene-title'

const FIELD = 'flex h-11 w-full rounded-md border border-input bg-background px-3 text-base'

/** Base for every change made here */
function opBase(org: string) {
  return { id: newOpId(), org, createdAt: opTime() }
}

/** Saves changes on the device, in order; each is sent when the connection allows. */
async function queueAll(ops: SyncOpInput[]) {
  for (const op of ops) await queueOp(op)
}

/**
 * Setting up a scene without a connection: switch it on, title it, take its
 * bed photo and mark plants on it, new or existing. Every change waits on the
 * device and is sent when the connection returns.
 */
export function OfflineSceneEditor({ scene, snap }: { scene: OfflineScene; snap: OrgSnapshot }) {
  const [error, setError] = useState<string | null>(null)
  const queue = (ops: SyncOpInput[]) => void queueAll(ops).catch(() => setError('Couldn’t save on this device. Please try again.'))

  return (
    <div className="space-y-5">
      <SceneSettings scene={scene} org={snap.org.slug} onQueue={(op) => queue([op])} />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <PhotoSceneEditor snap={snap} scene={scene} onQueue={queue} />
    </div>
  )
}

function SceneSettings({ scene, org, onQueue }: { scene: OfflineScene; org: string; onQueue: (op: SyncOpInput) => void }) {
  const [title, setTitle] = useState(scene.title ?? '')
  const active = scene.active ?? true
  const changed = title.trim() !== (scene.title ?? '')

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <Switch
          checked={active}
          onCheckedChange={(on) => onQueue({ ...opBase(org), kind: 'updateScene', sceneId: scene.id, active: on })}
        />
        <span className="font-medium">{active ? 'Active' : 'Inactive'}</span>
      </label>
      <form
        className="space-y-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          onQueue({ ...opBase(org), kind: 'updateScene', sceneId: scene.id, title: title.trim() || null })
        }}
      >
        <Label htmlFor="off-scene-title">Title (optional)</Label>
        <div className="flex gap-2">
          <input
            id="off-scene-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_SCENE_TITLE}
            placeholder="e.g. Cactus bed by the castle wall"
            className={FIELD}
          />
          <Button type="submit" variant="outline" disabled={!changed} className="h-11 shrink-0">
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Not printed on the QR label.</p>
      </form>
    </div>
  )
}
