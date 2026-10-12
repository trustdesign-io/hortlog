import type { ScenePerspective } from '@/lib/scene-perspective'
import { cn } from '@/lib/utils'

interface PerspectiveFieldProps {
  defaultValue: ScenePerspective
  disabled?: boolean
}

const OPTIONS: Array<{ value: ScenePerspective; label: string; hint: string }> = [
  { value: 'BED', label: 'Bed', hint: 'Lies on the ground and stretches away from the viewer.' },
  { value: 'WALL', label: 'Wall', hint: 'Stands upright, directly in front of the viewer.' },
]

/** Bed lines converge towards the back; wall lines stay square. */
function Diagram({ perspective }: { perspective: ScenePerspective }) {
  return (
    <svg
      viewBox="0 0 64 44"
      className="h-11 w-16 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {perspective === 'BED' ? (
        <>
          <path d="M22 6h20l16 32H6L22 6Z" />
          <path d="M16.5 22h31M11 30h42" />
          <path d="M32 6v32M27 6l-10 32M37 6l10 32" />
        </>
      ) : (
        <>
          <rect x="10" y="4" width="44" height="36" rx="2" />
          <path d="M10 16h44M10 28h44M24.7 4v36M39.3 4v36" />
        </>
      )}
    </svg>
  )
}

export function PerspectiveField({ defaultValue, disabled }: PerspectiveFieldProps) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">Perspective</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
              'has-[:checked]:border-primary has-[:checked]:bg-primary/5',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type="radio"
              name="perspective"
              value={o.value}
              defaultChecked={o.value === defaultValue}
              className="sr-only"
            />
            <Diagram perspective={o.value} />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
