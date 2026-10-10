import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { ScientificName } from '@/components/ui/scientific-name'
import { cn } from '@/lib/utils'

interface SamplePoint {
  title: string
  body: string
}

interface SampleEntry {
  recordNo: string
  date: string
  name: string
  authority: string
  family: string
  action: string
}

const POINTS: SamplePoint[] = [
  {
    title: 'A record that builds itself',
    body: 'Log work in a few taps from the bed or glasshouse. Each plant gets a numbered record; later work adds to it.',
  },
  {
    title: 'Kept to a professional standard',
    body: 'Botanical names set correctly, determinations and label readings recorded, corrections kept rather than overwritten.',
  },
  {
    title: 'Show it to employers',
    body: 'Share a read-only link or print it. Evidence of real experience, not a list of claims.',
  },
]

// Illustrative entries only — not a real member's record.
const SAMPLE_ENTRIES: SampleEntry[] = [
  { recordNo: '014', date: '17 May 2027', name: 'Echium pininana', authority: 'Webb & Berthel.', family: 'Boraginaceae', action: 'Pruned' },
  { recordNo: '013', date: '12 May 2027', name: 'Musa basjoo', authority: 'Siebold & Zucc.', family: 'Musaceae', action: 'Mulched' },
  { recordNo: '012', date: '3 May 2027', name: 'Eucalyptus gunnii', authority: 'Hook.f.', family: 'Myrtaceae', action: 'Planted' },
]

export function PersonalRecordSection() {
  return (
    <section aria-labelledby="personal-record-heading" className="border-t border-border px-6 py-20">
      <div className="max-w-5xl mx-auto grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <h2
            id="personal-record-heading"
            className="font-heading text-2xl sm:text-3xl font-medium mb-4"
          >
            Your work, on the record
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            Every plant you work with goes into your own record: what it is, where it grows,
            and what you did. It stays with you when you move on.
          </p>

          <ul className="flex flex-col gap-6 mb-10">
            {POINTS.map((point) => (
              <li key={point.title} className="flex flex-col gap-1">
                <h3 className="font-heading text-lg font-medium">{point.title}</h3>
                <p className="text-sm text-muted-foreground">{point.body}</p>
              </li>
            ))}
          </ul>

          <Link href="/sign-up" className={cn(buttonVariants({ size: 'xl' }), 'w-full sm:w-auto')}>
            Start your record
          </Link>
        </div>

        <figure className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <figcaption className="mb-4 flex items-baseline justify-between gap-4">
            <span className="font-heading text-base font-medium">My record</span>
            <span className="text-xs text-muted-foreground">Example</span>
          </figcaption>
          <ol className="divide-y divide-border">
            {SAMPLE_ENTRIES.map((entry) => (
              <li key={entry.recordNo} className="flex gap-4 py-3">
                <span className="font-mono text-xs text-muted-foreground pt-1 shrink-0">
                  {entry.recordNo}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <ScientificName>{entry.name}</ScientificName>{' '}
                    <span className="text-muted-foreground">{entry.authority}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.family} · {entry.date}
                  </p>
                </div>
                <span className="shrink-0 self-start rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {entry.action}
                </span>
              </li>
            ))}
          </ol>
        </figure>
      </div>
    </section>
  )
}
