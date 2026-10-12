'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateScene, deleteScene } from '@/lib/actions/scene'
import { toSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ScenePerspective } from '@/lib/scene-perspective'
import { PerspectiveField } from '../../perspective-field'
import type { ActionResult } from '@/lib/shared/types'

interface SceneDetailsFormProps {
  orgSlug: string
  scene: {
    id: string
    name: string
    slug: string
    primaryCollectionId: string | null
    perspective: ScenePerspective
    plantCount: number
  }
  collections: Array<{ id: string; name: string }>
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

export function SceneDetailsForm({ orgSlug, scene, collections }: SceneDetailsFormProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    updateScene.bind(null, orgSlug, scene.id),
    null,
  )
  const [slug, setSlug] = useState(scene.slug)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={scene.name} required maxLength={120} disabled={isPending} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                onBlur={() => !slug && setSlug(toSlug(scene.name))}
                minLength={2}
                maxLength={48}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Part of the scene&apos;s public web address. Printed QR codes keep working if you change it; links
                shared elsewhere won&apos;t.
              </p>
            </div>
            <PerspectiveField defaultValue={scene.perspective} disabled={isPending} />
            {collections.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="primaryCollectionId">Primary collection</Label>
                <select
                  id="primaryCollectionId"
                  name="primaryCollectionId"
                  defaultValue={scene.primaryCollectionId ?? ''}
                  disabled={isPending}
                  className={selectClass}
                >
                  <option value="">None</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Visitors who scan the QR code see the scene presented within this collection.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <DeleteSceneCard orgSlug={orgSlug} sceneId={scene.id} name={scene.name} plantCount={scene.plantCount} />
    </div>
  )
}

function DeleteSceneCard({
  orgSlug,
  sceneId,
  name,
  plantCount,
}: {
  orgSlug: string
  sceneId: string
  name: string
  plantCount: number
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      // Redirects to the scenes list on success
      const result = await deleteScene(orgSlug, sceneId)
      if (result && !result.success) setError(result.error ?? 'Failed to delete the scene.')
    })
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base">Delete scene</CardTitle>
        <CardDescription>
          Its QR code stops working. The plants stay in your specimens, just no longer placed on a grid.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="destructive" className="w-full sm:w-auto" />}>
            Delete scene
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {name}?</DialogTitle>
              <DialogDescription>
                {plantCount > 0
                  ? `${plantCount} plant${plantCount === 1 ? '' : 's'} will be taken off this grid. `
                  : ''}
                Any printed QR codes for this scene will stop working. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? 'Deleting…' : 'Delete scene'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
