import { Flower2 } from 'lucide-react'
import { currentStage, seenLabel, STAGE_LABELS, type PlantStageValue } from '@/lib/plant-stage'

interface PlantStageBadgeProps {
  stage: PlantStageValue | null | undefined
  seenAt: Date | null | undefined
}

/** For visitors: "In flower · seen 12 Oct", only while it's current */
export function PlantStageBadge({ stage, seenAt }: PlantStageBadgeProps) {
  const now = currentStage(stage, seenAt)
  if (!now || !seenAt) return null
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
      <Flower2 className="h-4 w-4" aria-hidden="true" />
      {STAGE_LABELS[now]}
      <span className="font-normal text-muted-foreground">· {seenLabel(seenAt)}</span>
    </p>
  )
}
