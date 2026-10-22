import { ChevronRight, Flower2 } from 'lucide-react'
import { seenLabel, STAGE_LABELS } from '@/lib/plant-stage'
import { distinctCommonName } from '@/lib/species-name'
import type { FloweringGroup } from '@/lib/flowering'
import { ScientificName } from '@/components/ui/scientific-name'
import { SpecimenImage } from '@/components/ui/specimen-image'

/** What's in flower, grouped by place. Links open hortlog (in a new tab when embedded elsewhere). */
export function FloweringList({ groups, linkBase = '', newTab = false }: { groups: FloweringGroup[]; linkBase?: string; newTab?: boolean }) {
  return (
    <>
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label} className="space-y-2">
          <h2 className="font-heading text-lg">{group.label}</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {group.plants.map((s) => {
              const common = distinctCommonName(s)
              return (
                <li key={s.id}>
                  <a
                    href={`${linkBase}${s.path}`}
                    {...(newTab ? { target: '_blank', rel: 'noopener' } : {})}
                    className="flex min-h-16 items-center gap-3 px-3 py-2 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <SpecimenImage imageUrl={s.photoUrl} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <ScientificName className="block truncate font-medium leading-tight">{s.scientificName}</ScientificName>
                      <span className="block truncate text-sm text-muted-foreground">
                        {common && `${common} · `}
                        <span className={s.stage === 'FLOWER' ? 'font-medium text-pink-700' : undefined}>
                          {s.stage === 'FLOWER' && <Flower2 className="mr-0.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />}
                          {STAGE_LABELS[s.stage]}
                        </span>
                        {` · ${seenLabel(s.seenAt)}`}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {newTab && <span className="sr-only">(opens in a new tab)</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
