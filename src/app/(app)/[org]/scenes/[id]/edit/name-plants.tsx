'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { identifySpecimen } from '@/lib/actions/specimen'
import { cellLabel } from '@/lib/scene-grid'
import { scenePhotoApiPath } from '@/lib/offline/scene-photos'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SpeciesPicker, type PickedSpecies } from '@/components/species/species-picker'

export interface PlantToName {
  id: string
  gridCell: string
  /** What it was called when added, e.g. by Claude from the bed photo */
  fieldName: string
  note: string | null
  photo: [number, number] | null
}

interface NamePlantsProps {
  org: string
  sceneId: string
  plants: PlantToName[]
}

/**
 * Plants still Unidentified in this scene, numbered on the bed photo where
 * their position is known. Tap one, search its name, save.
 */
export function NamePlants({ org, sceneId, plants }: NamePlantsProps) {
  const router = useRouter()
  const [openId, setOpenId] = useState<string | null>(null)
  const [picked, setPicked] = useState<PickedSpecies | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [photoOk, setPhotoOk] = useState(true)
  const [saving, startSave] = useTransition()

  if (plants.length === 0) return null
  const spotted = plants.some((p) => p.photo)

  function open(id: string) {
    setOpenId((current) => (current === id ? null : id))
    setPicked(null)
    setError(null)
    window.setTimeout(() => document.getElementById(`name-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50)
  }

  function save(id: string) {
    if (!picked) return
    startSave(async () => {
      const r = await identifySpecimen(org, id, picked.id)
      if (!r.success) {
        setError(r.error)
        return
      }
      setOpenId(null)
      setPicked(null)
      router.refresh()
    })
  }

  return (
    <section className="space-y-3 rounded-xl border bg-card p-3" aria-labelledby="name-plants-title">
      <div>
        <h2 id="name-plants-title" className="text-sm font-medium">
          Name the plants ({plants.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          {spotted ? 'Tap a number on the photo or a plant below.' : 'Tap a plant to name it.'}
        </p>
      </div>

      {spotted && photoOk && (
        <div className="relative overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- private photo behind a signed link */}
          <img src={scenePhotoApiPath(org, sceneId)} alt="Photo of the bed" className="block h-auto w-full" onError={() => setPhotoOk(false)} />
          {plants.map((p, i) =>
            p.photo ? (
              <button
                key={p.id}
                type="button"
                onClick={() => open(p.id)}
                className={cn(
                  'absolute flex h-7 min-w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white px-1 text-xs font-semibold shadow-md',
                  openId === p.id ? 'bg-primary text-primary-foreground' : 'bg-black/70 text-white',
                )}
                style={{ left: `${p.photo[0] * 100}%`, top: `${p.photo[1] * 100}%` }}
                aria-label={`${i + 1}: ${p.fieldName}`}
                aria-pressed={openId === p.id}
              >
                {i + 1}
              </button>
            ) : null,
          )}
        </div>
      )}

      <ol className="divide-y rounded-lg border">
        {plants.map((p, i) => {
          const isOpen = openId === p.id
          return (
            <li key={p.id} id={`name-${p.id}`} className="p-3">
              <button
                type="button"
                onClick={() => open(p.id)}
                className="flex w-full items-start gap-3 text-left"
                aria-expanded={isOpen}
              >
                <span
                  className={cn(
                    'flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-xs font-semibold',
                    isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted',
                  )}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{p.fieldName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {cellLabel(p.gridCell)?.replace(/^r/, 'R')}
                    {p.note ? ` · ${p.note}` : ''}
                  </span>
                </span>
              </button>
              {isOpen && (
                <div className="mt-3 space-y-2">
                  <SpeciesPicker id={`species-${p.id}`} value={picked} onChange={setPicked} disabled={saving} />
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                  <Button type="button" className="w-full" disabled={!picked || saving} onClick={() => save(p.id)}>
                    {saving ? 'Saving…' : 'Save name'}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
