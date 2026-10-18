'use client'

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { Camera, CloudCheck, CloudOff, Image as ImageIcon, Loader2, Move, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { newDeviceId, newOpId, opTime, type SyncOpInput } from '@/lib/offline/ops'
import { getLocalScenePhoto, SCENE_PHOTO_EVENT, takeScenePhoto, type LocalScenePhoto } from '@/lib/offline/scene-photos'
import { bedPhotoUrl, type OfflineScene, type OfflineSpecimen, type OrgSnapshot } from '@/lib/offline/types'
import { cn } from '@/lib/utils'
import { UnavailableAction } from '@/components/ui/unavailable-action'

const FIELD = 'flex h-11 w-full rounded-md border border-input bg-background px-3 text-base'

/** The description a not-yet-identified plant was logged with, e.g. "Tall blue agave" */
export function fieldNote(s: OfflineSpecimen): string | undefined {
  return /^Field name: (.+)$/m.exec(s.notes ?? '')?.[1]
}

/**
 * What to call a plant here: its species, or for one not yet identified,
 * "Unidentified" first so it can't pass for a real name, then its description.
 */
export function plantLabel(s: OfflineSpecimen): string {
  if (s.species.scientificName !== 'Unidentified') return s.species.scientificName
  const note = fieldNote(s)
  return note ? `Unidentified · ${note}` : 'Unidentified'
}

/** Plants marked on the photo, numbered back to front, left to right (as visitors see them) */
export function numberedOnPhoto(specimens: OfflineSpecimen[]): (OfflineSpecimen & { photoX: number; photoY: number })[] {
  return specimens
    .filter((s): s is OfflineSpecimen & { photoX: number; photoY: number } => s.photoX != null && s.photoY != null)
    .sort((a, b) => a.photoY - b.photoY || a.photoX - b.photoX)
}

interface PhotoSceneEditorProps {
  snap: OrgSnapshot
  scene: OfflineScene
  /** Saves a change on the device and sends it when it can */
  onQueue: (ops: SyncOpInput[]) => void
  /** Online only: naming an unidentified plant, shown in its options */
  renderIdentify?: (specimen: OfflineSpecimen, done: () => void) => ReactNode
}

type Spot = { x: number; y: number }

/**
 * A scene is its bed photo: tap where a plant is to add it, tap a number to
 * move it or take it off. Works without signal; changes are sent when they can be.
 */
export function PhotoSceneEditor({ snap, scene, onQueue, renderIdentify }: PhotoSceneEditorProps) {
  const org = snap.org.slug
  const inputId = useId()
  const [local, setLocal] = useState<LocalScenePhoto | null>(null)
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const [remoteFailed, setRemoteFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  // Adding a plant at a spot; a plant whose options are open; a plant being moved (next tap places it)
  const [adding, setAdding] = useState<Spot | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const img = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      void getLocalScenePhoto(scene.id).then((p) => {
        if (!cancelled) setLocal(p ?? null)
      })
    load()
    window.addEventListener(SCENE_PHOTO_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(SCENE_PHOTO_EVENT, load)
    }
  }, [scene.id])

  useEffect(() => {
    if (!local) return setLocalUrl(null)
    const url = URL.createObjectURL(local.blob)
    setLocalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [local])

  const inScene = useMemo(() => snap.specimens.filter((s) => s.sceneId === scene.id), [snap.specimens, scene.id])
  const onPhoto = useMemo(() => numberedOnPhoto(inScene), [inScene])
  const offPhoto = inScene.filter((s) => s.photoX == null || s.photoY == null)
  const toName = onPhoto.filter((s) => s.species.scientificName === 'Unidentified').length
  const open = inScene.find((s) => s.id === openId) ?? null
  const moving = inScene.find((s) => s.id === movingId) ?? null

  const src = localUrl ?? (scene.photoVersion && !remoteFailed ? bedPhotoUrl(org, scene.id, scene.photoVersion) : null)
  const base = () => ({ id: newOpId(), org, createdAt: opTime() })
  const placeAt = (specimenId: string, spot: Spot): SyncOpInput => ({ ...base(), kind: 'placeOnPhoto', sceneId: scene.id, specimenId, ...spot })

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setPhotoError(null)
    try {
      await takeScenePhoto(org, scene.id, file)
      setRemoteFailed(false)
    } catch {
      setPhotoError('That photo couldn’t be saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  function tapPhoto(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    const rect = img.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const spot = {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
    if (moving) {
      onQueue([placeAt(moving.id, spot)])
      setMovingId(null)
      return
    }
    setAdding(spot)
  }

  const photoButtons = (
    <div className="grid grid-cols-2 gap-2">
      <label htmlFor={inputId} className={cn(buttonVariants({ variant: src ? 'outline' : 'default', size: src ? 'sm' : 'lg' }), 'cursor-pointer')}>
        {busy ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Camera className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        {src ? 'Retake' : 'Take photo'}
      </label>
      <label
        htmlFor={`${inputId}-pick`}
        className={cn(buttonVariants({ variant: 'outline', size: src ? 'sm' : 'lg' }), 'cursor-pointer')}
      >
        <ImageIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Choose photo
      </label>
      <input id={inputId} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick} disabled={busy} />
      <input id={`${inputId}-pick`} type="file" accept="image/*" className="sr-only" onChange={onPick} disabled={busy} />
    </div>
  )

  if (!src) {
    return (
      <section className="space-y-4 rounded-2xl border bg-card p-5 text-center" aria-labelledby={`${inputId}-start`}>
        <Camera className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <h2 id={`${inputId}-start`} className="font-heading text-xl">
            Start with a photo of the bed
          </h2>
          <p className="text-sm text-muted-foreground">
            Stand where visitors will, at the front of the bed, and fit it all in. Then tap each plant on the photo to add it.
          </p>
        </div>
        {photoButtons}
        {photoError && (
          <p className="text-sm text-destructive" role="alert">
            {photoError}
          </p>
        )}
        {offPhoto.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {offPhoto.length} plant{offPhoto.length === 1 ? ' is' : 's are'} in this scene already; you&rsquo;ll mark
            {offPhoto.length === 1 ? ' it' : ' them'} on the photo next.
          </p>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {moving ? (
          <span className="font-medium text-foreground">Tap the photo where {plantLabel(moving)} is.</span>
        ) : (
          <>
            Tap a plant on the photo to add it. Tap a number to move it{renderIdentify ? ', name it' : ''} or take it off.
            {toName > 0 && (
              <span className="mt-1 block font-medium text-foreground">
                {toName} still to name: the numbers in amber.
              </span>
            )}
          </>
        )}
      </p>

      <div
        className={cn('relative -mx-4 cursor-crosshair overflow-hidden bg-muted sm:mx-0 sm:rounded-2xl', moving && 'ring-4 ring-primary')}
        onClick={tapPhoto}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- device photo or a signed link */}
        <img
          ref={img}
          src={src}
          alt="The bed. Tap a plant to add it."
          className="block h-auto w-full select-none"
          draggable={false}
          onError={() => {
            if (!localUrl) setRemoteFailed(true)
          }}
        />
        {onPhoto.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpenId(s.id)}
            aria-label={`${i + 1}: ${plantLabel(s)}`}
            className={cn(
              'absolute flex h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 px-1.5 text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.35)]',
              s.id === movingId
                ? 'border-white bg-primary text-primary-foreground'
                : s.species.scientificName === 'Unidentified'
                  ? 'border-white bg-amber-300 text-[#16201A]'
                  : 'border-white/90 bg-white/90 text-[#16201A]',
              s.pending && 'border-dashed',
            )}
            style={{ left: `${s.photoX * 100}%`, top: `${s.photoY * 100}%` }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {moving && (
        <Button type="button" variant="outline" className="w-full" onClick={() => setMovingId(null)}>
          Cancel moving
        </Button>
      )}

      {offPhoto.length > 0 && (
        <section className="space-y-2 rounded-xl border p-3" aria-labelledby={`${inputId}-off`}>
          <h2 id={`${inputId}-off`} className="text-sm font-medium">
            Not on the photo yet ({offPhoto.length})
          </h2>
          <p className="text-xs text-muted-foreground">Tap one, then tap where it is on the photo.</p>
          <ul className="flex flex-wrap gap-2">
            {offPhoto.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setMovingId(s.id)}
                  aria-pressed={movingId === s.id}
                  className={cn(
                    'min-h-10 rounded-full border px-3 text-sm',
                    movingId === s.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
                  )}
                >
                  {plantLabel(s)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-2">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {local && !local.sentAt ? (
            <>
              <CloudOff className="h-3.5 w-3.5" aria-hidden="true" /> Photo on this device – sends when there&rsquo;s signal
            </>
          ) : (
            <>
              <CloudCheck className="h-3.5 w-3.5" aria-hidden="true" /> Photo saved to hortlog
            </>
          )}
        </p>
        {photoButtons}
        {photoError && (
          <p className="text-sm text-destructive" role="alert">
            {photoError}
          </p>
        )}
      </div>

      {/* Add a plant where the photo was tapped */}
      <Sheet open={adding !== null} onOpenChange={(o) => !o && setAdding(null)}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add a plant here</SheetTitle>
            <SheetDescription>New, or one already in hortlog.</SheetDescription>
          </SheetHeader>
          {adding && (
            <AddPlant
              snap={snap}
              scene={scene}
              onDone={(ops) => {
                onQueue(ops)
                setAdding(null)
              }}
              place={(specimenId) => placeAt(specimenId, adding)}
              base={base}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* A marked plant's options */}
      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className={cn(open.species.scientificName === 'Unidentified' && 'text-amber-700 dark:text-amber-300')}>
                  {open.species.scientificName === 'Unidentified' ? 'Unidentified' : plantLabel(open)}
                </SheetTitle>
                <SheetDescription>
                  {open.species.scientificName === 'Unidentified' ? (fieldNote(open) ?? 'Not identified yet') : open.species.commonName}
                  {open.pending && ' · waiting to send'}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-2 px-4 pb-6">
                {open.species.scientificName === 'Unidentified' &&
                  (renderIdentify && !open.pending ? (
                    <div className="space-y-2 rounded-xl border p-3">{renderIdentify(open, () => setOpenId(null))}</div>
                  ) : (
                    <UnavailableAction
                      reason={open.pending ? 'You can name this plant once it has sent.' : 'Naming plants needs a connection.'}
                      className={buttonVariants({ variant: 'outline' })}
                    >
                      Name this plant
                    </UnavailableAction>
                  ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMovingId(open.id)
                    setOpenId(null)
                  }}
                >
                  <Move className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Move on the photo
                </Button>
                {open.pending ? (
                  <UnavailableAction reason="You can edit this plant once it has sent." className={buttonVariants({ variant: 'outline' })}>
                    Edit the plant
                  </UnavailableAction>
                ) : (
                  <a href={`/${org}/specimens/${open.id}/edit`} className={cn(buttonVariants({ variant: 'outline' }))}>
                    Edit the plant
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    onQueue([{ ...base(), kind: 'unplaceSpecimen', specimenId: open.id }])
                    setOpenId(null)
                  }}
                >
                  <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Take off this scene
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** A new plant (hortlog looks the typed name up when it's sent) or one already in hortlog */
function AddPlant({
  snap,
  scene,
  onDone,
  place,
  base,
}: {
  snap: OrgSnapshot
  scene: OfflineScene
  onDone: (ops: SyncOpInput[]) => void
  place: (specimenId: string) => SyncOpInput
  base: () => { id: string; org: string; createdAt: string }
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const listId = useId()

  function submitNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const typed = String(fd.get('name') ?? '').trim()
    if (!typed) return setError('Type the plant’s name, or what you’d call it.')
    const lower = typed.toLowerCase()
    // A species already in hortlog is used as is; anything else is looked up when sent
    const known = snap.speciesList?.find((s) => s.scientificName.toLowerCase() === lower || s.commonName.toLowerCase() === lower)
    const specimenId = newDeviceId()
    const text = (field: string) => String(fd.get(field) ?? '').trim() || null
    onDone([
      {
        ...base(),
        kind: 'createSpecimen',
        specimenId,
        speciesId: known?.id ?? null,
        fieldName: known ? null : typed,
        accessionNumber: text('accession'),
        notes: text('notes'),
      },
      place(specimenId),
    ])
  }

  const others = snap.specimens
    .filter((s) => !(s.sceneId === scene.id && s.photoX != null))
    .filter((s) => {
      const t = q.trim().toLowerCase()
      return !t || [s.species.scientificName, s.species.commonName, s.accessionNumber].some((v) => v?.toLowerCase().includes(t))
    })
    .slice(0, 100)

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="flex gap-1 rounded-xl border bg-muted p-1" role="tablist">
        {(['new', 'existing'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn('min-h-10 flex-1 rounded-lg px-3 text-sm font-medium', mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          >
            {m === 'new' ? 'New plant' : 'Already in hortlog'}
          </button>
        ))}
      </div>

      {mode === 'new' ? (
        <form onSubmit={submitNew} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${listId}-name`}>Name</Label>
            <input
              id={`${listId}-name`}
              name="name"
              list={`${listId}-species`}
              autoComplete="off"
              placeholder="Botanical name, or what you’d call it"
              className={FIELD}
              required
              autoFocus
            />
            <datalist id={`${listId}-species`}>
              {snap.speciesList?.map((s) => (
                <option key={s.id} value={s.scientificName}>
                  {s.commonName}
                </option>
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              hortlog looks the name up. If it can&rsquo;t be sure, the plant is saved as Unidentified with your name for
              it, ready to name later.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${listId}-acc`}>Accession number (optional)</Label>
            <input id={`${listId}-acc`} name="accession" autoComplete="off" className={FIELD} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${listId}-notes`}>Notes (optional)</Label>
            <Textarea id={`${listId}-notes`} name="notes" rows={2} />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Add here
          </Button>
        </form>
      ) : (
        <div className="space-y-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plants"
            aria-label="Search plants"
            className={FIELD}
          />
          {others.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No plants match.</p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border">
              {others.map((s) => {
                const elsewhere = s.sceneId && s.sceneId !== scene.id ? snap.scenes.find((x) => x.id === s.sceneId) : undefined
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onDone([place(s.id)])}
                      className="flex min-h-12 w-full flex-col items-start px-3 py-2 text-left hover:bg-muted"
                    >
                      <span className="font-medium italic">{plantLabel(s)}</span>
                      <span className="text-xs text-muted-foreground">
                        {[s.species.commonName, s.accessionNumber, elsewhere && `moves from ${elsewhere.title ?? elsewhere.name}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
