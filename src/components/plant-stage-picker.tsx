'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setPlantStage } from '@/lib/actions/plant-stage'
import { newOpId } from '@/lib/offline/ops'
import { queueOp } from '@/lib/offline/sync'
import { currentStage, PLANT_STAGES, seenLabel, STAGE_LABELS, type PlantStageValue } from '@/lib/plant-stage'
import { cn } from '@/lib/utils'

interface StageButtonsProps {
  /** The plant's latest stage, if it's still current */
  value: PlantStageValue | null
  onPick: (stage: PlantStageValue) => void
  disabled?: boolean
}

/** Four big buttons: In bud, In flower, In fruit, Over. Tapping the current one confirms it again. */
export function StageButtons({ value, onPick, disabled }: StageButtonsProps) {
  return (
    <div role="group" aria-label="What it's doing now" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PLANT_STAGES.map((stage) => (
        <button
          key={stage}
          type="button"
          disabled={disabled}
          aria-pressed={value === stage}
          onClick={() => onPick(stage)}
          className={cn(
            'min-h-11 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            value === stage ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
          )}
        >
          {STAGE_LABELS[stage]}
        </button>
      ))}
    </div>
  )
}

/** The stage as stored, shown to members: "In flower · seen 12 Oct" */
export function stageLine(stage: PlantStageValue | null | undefined, seenAt: Date | string | null | undefined): string {
  if (!stage || !seenAt) return 'Nobody has recorded its flowering yet.'
  const fresh = currentStage(stage, seenAt) !== null || stage === 'OVER'
  return `${STAGE_LABELS[stage]} · ${seenLabel(seenAt)}${fresh ? '' : ' (not confirmed lately, so visitors don’t see it)'}`
}

interface PlantStagePickerProps {
  orgSlug: string
  specimenId: string
  stage: PlantStageValue | null
  /** ISO */
  seenAt: string | null
}

/** On a plant's page, for members: record what it's doing now. Works without signal. */
export function PlantStagePicker({ orgSlug, specimenId, stage: initialStage, seenAt: initialSeen }: PlantStagePickerProps) {
  const router = useRouter()
  const [stage, setStage] = useState(initialStage)
  const [seenAt, setSeenAt] = useState(initialSeen)
  const [note, setNote] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function pick(next: PlantStageValue) {
    const now = new Date().toISOString()
    const saveOnDevice = async () => {
      await queueOp({ id: newOpId(), org: orgSlug, createdAt: now, kind: 'setStage', specimenId, stage: next })
      setNote('Saved on this device. It sends when you’re back online.')
    }
    setStage(next)
    setSeenAt(now)
    setNote(null)
    startTransition(async () => {
      try {
        if (!navigator.onLine) return await saveOnDevice()
        const result = await setPlantStage(orgSlug, specimenId, next)
        if (!result.success) {
          setStage(initialStage)
          setSeenAt(initialSeen)
          setNote(result.error)
          return
        }
        setNote('Saved.')
        router.refresh()
      } catch {
        try {
          await saveOnDevice()
        } catch {
          setNote('That couldn’t be saved. Try again.')
        }
      }
    })
  }

  return (
    <section className="mt-6 border-t pt-6" aria-labelledby="stage-heading">
      <h2 id="stage-heading" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Flowering
      </h2>
      <p className="mt-1 text-sm">{stageLine(stage, seenAt)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Visitors see it for 3 weeks after it was last recorded. Tap the same stage again to confirm it.
      </p>
      <div className="mt-3">
        <StageButtons value={stage} onPick={pick} disabled={isPending} />
      </div>
      <p className="mt-2 min-h-5 text-xs text-muted-foreground" aria-live="polite">
        {note}
      </p>
    </section>
  )
}
