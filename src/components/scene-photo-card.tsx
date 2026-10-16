'use client'

import { useEffect, useId, useState, type ChangeEvent } from 'react'
import { Camera, CloudCheck, CloudOff, Image as ImageIcon, Loader2 } from 'lucide-react'
import {
  getLocalScenePhoto,
  SCENE_PHOTO_EVENT,
  scenePhotoApiPath,
  takeScenePhoto,
  type LocalScenePhoto,
} from '@/lib/offline/scene-photos'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button-variants'

interface ScenePhotoCardProps {
  org: string
  sceneId: string
  className?: string
}

/**
 * A photo of the bed, for laying out the grid: taken here (with or without
 * signal) and sent to hortlog when it can be. Only editors see it.
 */
export function ScenePhotoCard({ org, sceneId, className }: ScenePhotoCardProps) {
  const inputId = useId()
  const [local, setLocal] = useState<LocalScenePhoto | null>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  // The copy on hortlog: shown when this device hasn't taken one; hidden if there's none
  const [remoteOk, setRemoteOk] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      void getLocalScenePhoto(sceneId).then((p) => {
        if (!cancelled) setLocal(p ?? null)
      })
    load()
    window.addEventListener(SCENE_PHOTO_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(SCENE_PHOTO_EVENT, load)
    }
  }, [sceneId])

  useEffect(() => {
    if (!local) {
      setLocalUrl(null)
      return
    }
    const url = URL.createObjectURL(local.blob)
    setLocalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [local])

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await takeScenePhoto(org, sceneId, file)
    } catch {
      setError('That photo couldn’t be saved. Try taking it again.')
    } finally {
      setBusy(false)
    }
  }

  const src = localUrl ?? (remoteOk ? scenePhotoApiPath(org, sceneId) : null)
  const status = local
    ? local.sentAt
      ? { Icon: CloudCheck, text: 'Saved to hortlog' }
      : { Icon: CloudOff, text: 'On this phone – sends when there’s signal' }
    : null

  return (
    <section className={cn('space-y-3 rounded-xl border bg-card p-3', className)} aria-labelledby={`${inputId}-title`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${inputId}-title`} className="text-sm font-medium">
            Bed photo
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {status ? (
              <span className="inline-flex items-center gap-1">
                <status.Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {status.text}
              </span>
            ) : (
              'For laying out the grid. Visitors see it once plants are marked on it.'
            )}
          </p>
        </div>
      </div>
      {/* Take one now, or pick one already on the device (e.g. taken earlier on site) */}
      <div className="grid grid-cols-2 gap-2">
        <label htmlFor={inputId} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer')}>
          {busy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Camera className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          {src ? 'Retake' : 'Take photo'}
        </label>
        <label htmlFor={`${inputId}-pick`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer')}>
          <ImageIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Choose photo
        </label>
      </div>
      <input id={inputId} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick} disabled={busy} />
      <input id={`${inputId}-pick`} type="file" accept="image/*" className="sr-only" onChange={onPick} disabled={busy} />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {src && (
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="block w-full overflow-hidden rounded-lg bg-muted"
          aria-expanded={expanded}
          aria-label={expanded ? 'Show the bed photo smaller' : 'Show the whole bed photo'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- private photo from a device blob or a signed link */}
          <img
            src={src}
            alt="Photo of the bed"
            className={cn('w-full', expanded ? 'h-auto object-contain' : 'h-40 object-cover')}
            onError={() => {
              if (!localUrl) setRemoteOk(false)
            }}
          />
        </button>
      )}
    </section>
  )
}
