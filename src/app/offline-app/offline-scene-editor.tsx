'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { HexGrid, HexOutline, HexPlantLabel, HexSubCells } from '@/components/hex-grid'
import { Button } from '@/components/ui/button'
import { ScenePhotoCard } from '@/components/scene-photo-card'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { GridSizeControls } from '@/app/(app)/[org]/scenes/[id]/edit/grid-size-controls'
import { unmeasuredCellWidth, useFittedGrid } from '@/hooks/use-fitted-grid'
import { HEX_HEIGHT_RATIO } from '@/lib/hex-grid'
import { newDeviceId, newOpId, type SyncOpInput } from '@/lib/offline/ops'
import { queueOp } from '@/lib/offline/sync'
import { specimenPhoto, type OfflineScene, type OfflineSpecimen, type OrgSnapshot } from '@/lib/offline/types'
import { cellKey, gridResizeError, hexOf, planGridOps, SUB_CELL_NAMES, type GridSide } from '@/lib/scene-grid'
import { MAX_SCENE_TITLE } from '@/lib/scene-title'
import { sceneTilt } from '@/lib/scene-perspective'
import { cn } from '@/lib/utils'
import { Photo } from './offline-photo'

const CELL_WIDTH_REM = 7.5
const PX_PER_REM = 16
const FIELD = 'flex h-11 w-full rounded-md border border-input bg-background px-3 text-base'

/** Where a plant is going: a whole hex, or one of a split hex's small cells. */
interface Target {
  row: number
  col: number
  sub: number | null
}

/** Base for every change made here */
function opBase(org: string) {
  return { id: newOpId(), org, createdAt: new Date().toISOString() }
}

function name(s: OfflineSpecimen): string {
  return s.species.scientificName
}

/**
 * Setting up a scene without a connection: switch it on, title it, size the
 * grid, split cells, and put plants in, new or existing. Every change waits
 * on the device and is sent when the connection returns.
 */
export function OfflineSceneEditor({ scene, snap }: { scene: OfflineScene; snap: OrgSnapshot }) {
  const org = snap.org.slug
  const gridBox = useRef<HTMLDivElement>(null)
  const fitted = useFittedGrid(gridBox, scene.gridRows, scene.gridCols, scene.perspective, CELL_WIDTH_REM * PX_PER_REM)
  const tilt = fitted?.tilt ?? sceneTilt(scene.perspective, scene.gridRows, CELL_WIDTH_REM * PX_PER_REM)
  const cellWidth = fitted ? `${fitted.cellPx}px` : unmeasuredCellWidth(scene.gridRows, scene.gridCols, tilt, CELL_WIDTH_REM)

  const [hex, setHex] = useState<{ row: number; col: number } | null>(null)
  const [adding, setAdding] = useState<Target | null>(null)
  const [error, setError] = useState<string | null>(null)

  const placed = useMemo(() => snap.specimens.filter((s) => s.sceneId === scene.id && s.gridCell), [snap.specimens, scene.id])
  const byCell = useMemo(() => new Map(placed.map((s) => [s.gridCell as string, s])), [placed])
  const split = useMemo(() => new Set(scene.splitCells ?? []), [scene.splitCells])

  function queue(op: SyncOpInput) {
    void queueOp(op).catch(() => setError('Couldn’t save on this device. Please try again.'))
  }

  function resize(side: GridSide, delta: 1 | -1) {
    const plan = planGridOps(
      { rows: scene.gridRows, cols: scene.gridCols, rowShift: scene.rowShift },
      [{ side, delta }],
      placed.map((s) => s.gridCell),
    )
    if (!plan.ok) return setError(gridResizeError(plan))
    setError(null)
    queue({ ...opBase(org), kind: 'resizeGrid', sceneId: scene.id, steps: [{ side, delta }] })
  }

  function setSplit(row: number, col: number, on: boolean) {
    const inHex = placed.filter((s) => hexOf(s.gridCell) === cellKey(row, col))
    if (!on && inHex.length > 1) return
    queue({ ...opBase(org), kind: 'splitHex', sceneId: scene.id, row, col, split: on })
  }

  function remove(s: OfflineSpecimen) {
    queue({ ...opBase(org), kind: 'unplaceSpecimen', specimenId: s.id })
  }

  const openHex = hex
  const hexKey = openHex ? cellKey(openHex.row, openHex.col) : null
  const hexIsSplit = hexKey !== null && split.has(hexKey)
  const wholePlant = hexKey ? byCell.get(hexKey) : undefined
  const subPlants = openHex
    ? Array.from({ length: 7 }, (_, k) => byCell.get(cellKey(openHex.row, openHex.col, k))).filter(
        (s): s is OfflineSpecimen => Boolean(s),
      )
    : []

  const outside = new Set(scene.blockedCells ?? [])
  return (
    <div className="space-y-5">
      <SceneSettings scene={scene} org={org} onQueue={queue} />

      <GridSizeControls rows={scene.gridRows} cols={scene.gridCols} onResize={resize} resizeError={error} />

      <div ref={gridBox} className="overflow-x-auto">
        <HexGrid
          className="mx-auto"
          role="grid"
          aria-label="Scene layout"
          rows={scene.gridRows}
          cols={scene.gridCols}
          cellWidth={cellWidth}
          tiltDeg={tilt}
          rowShift={scene.rowShift}
          renderCell={(row, col, style) => {
            const key = cellKey(row, col)
            if (outside.has(key)) {
              // Outside the bed: changed back in the live app
              return (
                <span key={key} className="hex-cell opacity-40" style={style} aria-label={`Outside the bed, row ${row + 1}, column ${col + 1}`} role="img">
                  <span className="hex-shape block">
                    <HexOutline className="text-border" />
                  </span>
                </span>
              )
            }
            const plant = byCell.get(key)
            const isSplit = split.has(key)
            const label = isSplit
              ? `Split cell, row ${row + 1}, column ${col + 1}`
              : plant
                ? `${name(plant)}, row ${row + 1}, column ${col + 1}`
                : `Empty cell, row ${row + 1}, column ${col + 1}`
            return (
              <button
                key={key}
                type="button"
                onClick={() => (isSplit || plant ? setHex({ row, col }) : setAdding({ row, col, sub: null }))}
                className="hex-cell group"
                style={style}
                aria-label={label}
              >
                <span className={cn('hex-shape block', plant ? 'bg-muted' : 'bg-card group-hover:bg-muted')}>
                  {isSplit ? (
                    <>
                      <HexOutline className="text-border" />
                      <HexSubCells
                        renderSub={(sub, subStyle) => {
                          const p = byCell.get(cellKey(row, col, sub))
                          return (
                            <span key={sub} className="hex-sub bg-muted/40" style={subStyle}>
                              {p ? <Photo src={specimenPhoto(p)} className="absolute inset-0 h-full w-full" /> : <HexOutline className="text-border" />}
                            </span>
                          )
                        }}
                      />
                    </>
                  ) : plant ? (
                    <>
                      <Photo src={specimenPhoto(plant)} className="absolute inset-0 h-full w-full" />
                      <HexPlantLabel scientificName={name(plant)} />
                    </>
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted-foreground">
                      <HexOutline className="text-border" />
                      <Plus className="relative h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </span>
              </button>
            )
          }}
        />
      </div>

      <ScenePhotoCard org={org} sceneId={scene.id} />

      {/* One hex: split it, merge it, take plants off, or fill its small cells */}
      <Sheet open={openHex !== null} onOpenChange={(open) => !open && setHex(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{hexIsSplit ? 'Split cell' : 'Cell'}</SheetTitle>
            <SheetDescription>{openHex && `Row ${openHex.row + 1}, column ${openHex.col + 1}`}</SheetDescription>
          </SheetHeader>
          {openHex && (
            <div className="space-y-5 px-4 pb-6">
              {hexIsSplit ? (
                <div
                  className="relative mx-auto"
                  style={{ width: 'min(100%, 20rem, calc((100dvh - 17rem) * 0.866))', aspectRatio: `1 / ${HEX_HEIGHT_RATIO}` }}
                >
                  <HexSubCells
                    renderSub={(sub, subStyle) => {
                      const p = byCell.get(cellKey(openHex.row, openHex.col, sub))
                      return p ? (
                        <div key={sub} className="hex-sub bg-muted" style={subStyle} role="group" aria-label={`${name(p)}, ${SUB_CELL_NAMES[sub]}`}>
                          <Photo src={specimenPhoto(p)} className="absolute inset-0 h-full w-full" />
                          <HexPlantLabel scientificName={name(p)} />
                          <RemoveButton label={name(p)} onRemove={() => remove(p)} />
                        </div>
                      ) : (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setHex(null)
                            setAdding({ row: openHex.row, col: openHex.col, sub })
                          }}
                          className="hex-sub group flex items-center justify-center bg-card text-muted-foreground hover:bg-muted"
                          style={subStyle}
                          aria-label={`Add a plant to the ${SUB_CELL_NAMES[sub]} cell`}
                        >
                          <HexOutline className="text-border" />
                          <Plus className="relative h-5 w-5" aria-hidden="true" />
                        </button>
                      )
                    }}
                  />
                </div>
              ) : (
                wholePlant && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <span className="min-w-0 truncate font-medium italic">{name(wholePlant)}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => remove(wholePlant)}>
                      Remove
                    </Button>
                  </div>
                )
              )}
              {hexIsSplit ? (
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={subPlants.length > 1}
                    onClick={() => {
                      setSplit(openHex.row, openHex.col, false)
                      setHex(null)
                    }}
                  >
                    Merge into one cell
                  </Button>
                  {subPlants.length > 1 && (
                    <p className="text-xs text-muted-foreground">A whole cell holds one plant. Remove all but one to merge.</p>
                  )}
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full" onClick={() => setSplit(openHex.row, openHex.col, true)}>
                  Split into 7 smaller cells
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Putting a plant in a cell */}
      <Sheet open={adding !== null} onOpenChange={(open) => !open && setAdding(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add a plant</SheetTitle>
            <SheetDescription>
              {adding &&
                `Row ${adding.row + 1}, column ${adding.col + 1}${adding.sub !== null ? `, ${SUB_CELL_NAMES[adding.sub]}` : ''}`}
            </SheetDescription>
          </SheetHeader>
          {adding && (
            <AddPlant
              key={`${adding.row},${adding.col},${adding.sub}`}
              snap={snap}
              scene={scene}
              onSplit={
                adding.sub === null
                  ? () => {
                      setSplit(adding.row, adding.col, true)
                      setAdding(null)
                      setHex({ row: adding.row, col: adding.col })
                    }
                  : null
              }
              onDone={(ops) => {
                ops.forEach((op) => queue(op))
                const back = adding.sub !== null ? { row: adding.row, col: adding.col } : null
                setAdding(null)
                if (back) setHex(back)
              }}
              target={adding}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function RemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} from the scene`}
      className="absolute left-1/2 top-[12%] z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center text-muted-foreground hover:text-destructive"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-sm">
        <X className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  )
}

/** Active switch and title for the scene. */
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

/**
 * A new plant (named however the member can: hortlog looks the name up when
 * it's sent) or one already in hortlog, put into the chosen cell.
 */
function AddPlant({
  snap,
  scene,
  target,
  onSplit,
  onDone,
}: {
  snap: OrgSnapshot
  scene: OfflineScene
  target: Target
  onSplit: (() => void) | null
  onDone: (ops: SyncOpInput[]) => void
}) {
  const org = snap.org.slug
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  const place = (specimenId: string): SyncOpInput => ({
    ...opBase(org),
    kind: 'placeSpecimen',
    sceneId: scene.id,
    specimenId,
    row: target.row,
    col: target.col,
    sub: target.sub,
  })

  function submitNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const typed = String(fd.get('name') ?? '').trim()
    if (!typed) return setError('Type the plant’s name, or what you’d call it.')
    const lower = typed.toLowerCase()
    // A species already in hortlog is used as is; anything else is looked up when sent
    const known = snap.speciesList?.find(
      (s) => s.scientificName.toLowerCase() === lower || s.commonName.toLowerCase() === lower,
    )
    const specimenId = newDeviceId()
    const text = (field: string) => String(fd.get(field) ?? '').trim() || null
    onDone([
      {
        ...opBase(org),
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
    .filter((s) => !(s.sceneId === scene.id && s.gridCell))
    .filter((s) => {
      const t = q.trim().toLowerCase()
      return !t || [s.species.scientificName, s.species.commonName, s.accessionNumber].some((v) => v?.toLowerCase().includes(t))
    })

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
            className={cn(
              'min-h-10 flex-1 rounded-lg px-3 text-sm font-medium',
              mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            {m === 'new' ? 'New plant' : 'Already in hortlog'}
          </button>
        ))}
      </div>

      {mode === 'new' ? (
        <form onSubmit={submitNew} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="off-plant-name">Name</Label>
            <input
              id="off-plant-name"
              name="name"
              list="off-species"
              autoComplete="off"
              placeholder="Botanical name, or what you’d call it"
              className={FIELD}
              required
            />
            <datalist id="off-species">
              {snap.speciesList?.map((s) => (
                <option key={s.id} value={s.scientificName}>
                  {s.commonName}
                </option>
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              When you&rsquo;re back online hortlog looks the name up. If it can&rsquo;t be sure, the plant is saved as
              Unidentified with your name for it in its notes.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="off-plant-acc">Accession number (optional)</Label>
            <input id="off-plant-acc" name="accession" autoComplete="off" className={FIELD} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="off-plant-notes">Notes (optional)</Label>
            <Textarea id="off-plant-notes" name="notes" rows={2} />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Add to this cell
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
                const elsewhere = s.sceneId ? snap.scenes.find((x) => x.id === s.sceneId) : undefined
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onDone([place(s.id)])}
                      className="flex min-h-12 w-full flex-col items-start px-3 py-2 text-left hover:bg-muted"
                    >
                      <span className="font-medium italic">{name(s)}</span>
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

      {onSplit && (
        <Button type="button" variant="ghost" className="w-full" onClick={onSplit}>
          Split this cell into 7 smaller ones instead
        </Button>
      )}
    </div>
  )
}
