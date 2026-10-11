import { TaxonName } from './taxon-name'

interface RecordHeaderProps {
  /** What kind of entry: "Plant record", "Work day · Volunteer". */
  kicker: string
  /** Title, with botanical names wrapped in <i>…</i>. */
  titleHtml: string
  /** "001", "S001", "E001", "D001". */
  recordNo: string
  children?: React.ReactNode
}

export function RecordHeader({ kicker, titleHtml, recordNo, children }: RecordHeaderProps) {
  return (
    <header className="border-b-2 border-foreground/80 pb-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kicker}</p>
          <h1 className="mt-1 font-heading text-2xl leading-tight text-balance sm:text-3xl">
            <TaxonName html={titleHtml} />
          </h1>
        </div>
        <p className="shrink-0 font-mono text-3xl font-light leading-none tabular-nums sm:text-4xl">
          <span className="sr-only">Record number </span>
          {recordNo}
        </p>
      </div>
      {children}
    </header>
  )
}
