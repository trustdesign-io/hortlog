import { prisma } from '@/lib/prisma'
import { formatRecordDate } from '@/lib/personal-record'
import { STAGE_LABELS } from '@/lib/plant-stage'

/** For members: every flowering sighting of this plant, newest first */
export async function PlantStageHistory({ specimenId }: { specimenId: string }) {
  const rows = await prisma.stageObservation.findMany({
    where: { specimenId },
    orderBy: { observedAt: 'desc' },
    take: 30,
    select: { id: true, stage: true, observedAt: true, user: { select: { name: true } } },
  })
  if (rows.length === 0) return null

  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted-foreground">Flowering history ({rows.length})</summary>
      <ol className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.id} className="flex gap-3">
            <time dateTime={r.observedAt.toISOString().slice(0, 10)} className="w-24 shrink-0 text-xs text-muted-foreground">
              {formatRecordDate(r.observedAt, 'short')}
            </time>
            <span>
              {STAGE_LABELS[r.stage]}
              {r.user?.name && <span className="text-muted-foreground"> · {r.user.name}</span>}
            </span>
          </li>
        ))}
      </ol>
    </details>
  )
}
