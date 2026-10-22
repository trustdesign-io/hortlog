'use client'

import { useId, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { strFromU8, unzipSync } from 'fflate'
import { CheckCircle2, FileSpreadsheet, FileArchive, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { parseCsv } from '@/lib/csv'
import {
  guessMapping,
  IMPORT_CHUNK,
  IMPORT_FIELDS,
  mappingFromMetaXml,
  rowsFromTable,
  type ImportField,
  type ImportMapping,
  type ImportRow,
} from '@/lib/accession-import'
import { existingAccessions, importAccessions, type ImportRowResult } from '@/lib/actions/accession-import'
import { cn } from '@/lib/utils'

type Format = 'dwc' | 'csv'

interface Loaded {
  fileName: string
  table: string[][]
  mapping: ImportMapping
}

const SELECT = 'flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base sm:h-9 sm:text-sm'

/** Reads a Darwin Core Archive (.zip) or its occurrence file, or any CSV */
async function readFile(file: File, format: Format): Promise<Loaded> {
  if (format === 'dwc' && /\.zip$/i.test(file.name)) {
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()))
    const meta = files['meta.xml'] ? strFromU8(files['meta.xml']) : null
    const coreName = meta ? /<core[\s\S]*?<location>([^<]+)<\/location>/.exec(meta)?.[1]?.trim() : null
    const core = (coreName && files[coreName]) || files['occurrence.csv'] || files['occurrence.txt']
    if (!core) throw new Error('That archive has no occurrence file.')
    const text = strFromU8(core)
    const delimiter = meta && /fieldsTerminatedBy="\\t"/.test(meta) ? '\t' : undefined
    const table = parseCsv(text, delimiter)
    const mapping = (meta && mappingFromMetaXml(meta)) || guessMapping(table[0] ?? [])
    return { fileName: file.name, table, mapping }
  }
  const table = parseCsv(await file.text())
  return { fileName: file.name, table, mapping: guessMapping(table[0] ?? []) }
}

/** Upload, match the columns, check the preview, then import in parts. */
export function ImportWizard({ orgSlug, gardenName }: { orgSlug: string; gardenName: string }) {
  const id = useId()
  const [format, setFormat] = useState<Format>('csv')
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [existing, setExisting] = useState<Set<string> | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<ImportRowResult[] | null>(null)

  const prepared = loaded ? rowsFromTable(loaded.table, loaded.mapping, { hasHeader, garden: gardenName }) : null
  const headers = loaded ? (hasHeader ? loaded.table[0] : loaded.table[0]?.map((_, i) => `Column ${i + 1}`)) ?? [] : []

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setResults(null)
    setExisting(null)
    try {
      const next = await readFile(file, format)
      if (next.table.length < 2) throw new Error('That file has no rows to import.')
      setLoaded(next)
      setHasHeader(true)
      const { rows } = rowsFromTable(next.table, next.mapping, { garden: gardenName })
      const numbers = rows.map((r) => r.accessionNumber).filter((a): a is string => a !== null)
      setExisting(new Set(await existingAccessions(orgSlug, numbers)))
    } catch (err) {
      setLoaded(null)
      setError(err instanceof Error ? err.message : 'That file couldn’t be read.')
    }
  }

  function setColumn(field: ImportField, value: string) {
    if (!loaded) return
    setLoaded({ ...loaded, mapping: { ...loaded.mapping, [field]: value === '' ? null : Number(value) } })
  }

  async function run(rows: ImportRow[]) {
    setError(null)
    setProgress({ done: 0, total: rows.length })
    const all: ImportRowResult[] = []
    for (let i = 0; i < rows.length; i += IMPORT_CHUNK) {
      const part = rows.slice(i, i + IMPORT_CHUNK)
      const res = await importAccessions(orgSlug, part).catch(() => null)
      if (!res || !res.success) {
        setError(`${res && !res.success ? res.error : 'The connection dropped.'} ${all.length} rows were imported; import the file again to carry on (rows already in hortlog are skipped).`)
        break
      }
      all.push(...res.results)
      setProgress({ done: Math.min(i + part.length, rows.length), total: rows.length })
    }
    setResults(all)
    setProgress(null)
  }

  if (results) {
    const count = (o: ImportRowResult['outcome']) => results.filter((r) => r.outcome === o).length
    const toName = results.filter((r) => r.outcome === 'unidentified')
    return (
      <section className="space-y-4 rounded-xl border bg-card p-4" aria-live="polite">
        <h2 className="flex items-center gap-2 font-heading text-lg">
          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
          Import finished
        </h2>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          <li>{count('created')} added</li>
          <li>{count('updated')} updated</li>
          <li>{count('unchanged')} already up to date</li>
          <li>{toName.length} added as Unidentified, to name</li>
          {count('failed') > 0 && <li className="text-destructive">{count('failed')} couldn&rsquo;t be imported</li>}
        </ul>
        {toName.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              These names didn&rsquo;t match one botanical name exactly, so they came in as Unidentified with the name
              kept in their notes. Open each to name it.
            </p>
            <ul className="max-h-60 divide-y overflow-y-auto rounded-lg border text-sm">
              {toName.map((r) => (
                <li key={r.slug ?? r.name}>
                  <Link href={`/${orgSlug}/specimens/${r.slug}`} className="flex min-h-11 items-center justify-between gap-3 px-3 hover:bg-muted">
                    <span className="truncate">{r.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{r.accessionNumber}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href={`/${orgSlug}/specimens`} className={buttonVariants()}>
            See specimens
          </Link>
          <Button variant="outline" onClick={() => { setResults(null); setLoaded(null) }}>
            Import another file
          </Button>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. What kind of file */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">1. What are you importing?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['csv', FileSpreadsheet, 'A spreadsheet (CSV)', 'From your records system, or any spreadsheet saved as CSV. You match its columns next.'],
              ['dwc', FileArchive, 'Darwin Core', 'A Darwin Core Archive (.zip) or its occurrence file, as used by GBIF and BGCI.'],
            ] as const
          ).map(([value, Icon, title, text]) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer gap-3 rounded-xl border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                format === value ? 'border-primary bg-primary/5' : 'bg-card',
              )}
            >
              <input
                type="radio"
                name="format"
                value={value}
                checked={format === value}
                onChange={() => {
                  setFormat(value)
                  setLoaded(null)
                }}
                className="sr-only"
              />
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground">{text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. The file */}
      <div className="space-y-2">
        <p className="text-sm font-medium">2. Choose the file</p>
        <label htmlFor={`${id}-file`} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 cursor-pointer')}>
          <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {loaded ? `Change file (${loaded.fileName})` : 'Choose file'}
        </label>
        <input
          id={`${id}-file`}
          type="file"
          accept={format === 'dwc' ? '.zip,.csv,.txt,text/csv,application/zip' : '.csv,.txt,text/csv'}
          className="sr-only"
          onChange={onFile}
        />
        {format === 'csv' && (
          <p className="text-xs text-muted-foreground">Excel or Numbers: save or export the sheet as CSV first.</p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      {loaded && prepared && (
        <>
          {/* 3. Columns */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium">3. Match the columns</h2>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="h-4 w-4" />
              The first row is headings
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(IMPORT_FIELDS) as ImportField[]).map((field) => (
                <div key={field} className="space-y-1">
                  <label htmlFor={`${id}-${field}`} className="text-sm">
                    {IMPORT_FIELDS[field]}
                    {field === 'scientificName' && <span className="text-muted-foreground"> (needed)</span>}
                  </label>
                  <select
                    id={`${id}-${field}`}
                    value={loaded.mapping[field] ?? ''}
                    onChange={(e) => setColumn(field, e.target.value)}
                    className={SELECT}
                  >
                    <option value="">Not in this file</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Locations can be nested with › &gt; / or |, e.g. &ldquo;Conservatory &gt; Arid &gt; Madagascar&rdquo;; any
              that don&rsquo;t exist yet are added.
            </p>
          </section>

          {/* 4. Preview */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium">4. Check and import</h2>
            {loaded.mapping.scientificName === null ? (
              <p className="text-sm text-destructive">Choose the column with the scientific name.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {prepared.rows.length} plant{prepared.rows.length === 1 ? '' : 's'} to import
                  {existing && existing.size > 0 && `, of which ${prepared.rows.filter((r) => r.accessionNumber && existing.has(r.accessionNumber)).length} are already in hortlog by accession number and will be updated`}
                  {prepared.skipped > 0 && `. ${prepared.skipped} row${prepared.skipped === 1 ? '' : 's'} without a name will be skipped`}.
                </p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Accession</th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Location</th>
                        <th className="px-3 py-2 font-medium">Will be</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {prepared.rows.slice(0, 8).map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs">{r.accessionNumber ?? '—'}</td>
                          <td className="px-3 py-2">
                            <i>{r.scientificName}</i>
                            {r.authority && <span className="text-muted-foreground"> {r.authority}</span>}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{r.location.join(' › ') || '—'}</td>
                          <td className="px-3 py-2 text-xs">
                            {r.accessionNumber && existing?.has(r.accessionNumber) ? 'Updated' : 'Added'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {prepared.rows.length > 8 && <p className="text-xs text-muted-foreground">Showing the first 8.</p>}
                <Button type="button" className="min-h-11" disabled={progress !== null || prepared.rows.length === 0} onClick={() => run(prepared.rows)}>
                  {progress ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Importing {progress.done} of {progress.total}…
                    </>
                  ) : (
                    `Import ${prepared.rows.length} plant${prepared.rows.length === 1 ? '' : 's'}`
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Names are matched to the botanical catalogue; any that aren&rsquo;t an exact match come in as
                  Unidentified, with the name kept, for you to confirm. Plants are matched by accession number, so
                  importing the same file again won&rsquo;t add them twice.
                </p>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
