import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { PrintButton } from '@/components/print-button'
import { labelUrl, stickerContent } from '@/lib/sticker-label'
import {
  A4,
  ADJUSTABLE,
  fitsPage,
  intoSheets,
  labelOrigin,
  sheetLayoutFrom,
  type AdjustableKey,
  type SheetLayout,
} from '@/lib/sticker-sheet'

export const metadata: Metadata = {
  title: 'Scene labels',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ org: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const FIELD = 'h-11 w-full rounded-md border border-input bg-background px-3 text-base'

/** A test page: each label's outline and centre, and a 100 mm ruler to check the printer's scale. */
function testSheet(layout: SheetLayout, count: number): string {
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    const { x, y } = labelOrigin(i, layout)
    const c = layout.label / 2
    parts.push(
      `<g transform="translate(${x} ${y})">`,
      `<rect width="${layout.label}" height="${layout.label}" fill="none" stroke="#000" stroke-width="0.2"/>`,
      `<path d="M${c - 2} ${c}h4M${c} ${c - 2}v4" stroke="#000" stroke-width="0.2"/>`,
      `<text x="${c}" y="${c + 6}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="2.5" fill="#666">${i + 1}</text>`,
      '</g>',
    )
  }
  // Ruler in the top margin
  const rx = (A4.width - 100) / 2
  const ry = Math.max(3, layout.top / 2)
  parts.push(`<path d="M${rx} ${ry}h100" stroke="#000" stroke-width="0.25"/>`)
  for (let mm = 0; mm <= 100; mm += 10) parts.push(`<path d="M${rx + mm} ${ry - 1.5}v3" stroke="#000" stroke-width="0.25"/>`)
  parts.push(
    `<text x="${A4.width / 2}" y="${ry - 2.2}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="2.6">This line should measure exactly 100 mm</text>`,
  )
  return parts.join('')
}

export default async function SceneLabelsPage({ params, searchParams }: PageProps) {
  const { org: orgSlug } = await params
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const sp = await searchParams

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true, name: true } })
  if (!org) return notFound()

  const layout = sheetLayoutFrom(sp)
  const mode = sp.mode === 'test' ? 'test' : 'labels'
  const filter = typeof sp.q === 'string' ? sp.q.trim() : ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'

  const scenes = await prisma.scene.findMany({
    where: { organisationId: org.id, ...(filter ? { name: { contains: filter, mode: 'insensitive' } } : {}) },
    select: { id: true, name: true, shortCode: true },
    orderBy: { name: 'asc' },
  })

  const sheets =
    mode === 'test'
      ? [testSheet(layout, layout.cols * layout.rows)]
      : intoSheets(scenes, layout).map((page) =>
          page
            .map((s, i) => {
              const { x, y } = labelOrigin(i, layout)
              return `<g transform="translate(${x} ${y})">${stickerContent({ url: labelUrl(siteUrl, s.shortCode), name: s.name })}</g>`
            })
            .join(''),
        )

  return (
    <div className="min-h-dvh bg-muted/40 print:bg-white">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 print:hidden">
        <div className="space-y-1">
          <Link href={`/${orgSlug}/scenes`} className="text-sm text-muted-foreground underline underline-offset-2">
            Back to scenes
          </Link>
          <h1 className="font-heading text-2xl font-medium">Scene labels</h1>
          <p className="text-sm text-muted-foreground">
            {org.name}: {mode === 'test' ? 'test page' : `${scenes.length} labels on ${sheets.length} A4 sheet${sheets.length === 1 ? '' : 's'}`},{' '}
            {layout.cols} × {layout.rows} labels of {layout.label} mm.
          </p>
        </div>

        <form method="get" className="space-y-4 rounded-xl border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Print</span>
              <select name="mode" defaultValue={mode} className={FIELD}>
                <option value="labels">Labels</option>
                <option value="test">Test page (outlines only)</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Only scenes named</span>
              <input name="q" defaultValue={filter} placeholder="e.g. Scene 0" className={FIELD} />
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Position (mm)</legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(Object.keys(ADJUSTABLE) as AdjustableKey[]).map((key) => (
                <label key={key} className="space-y-1.5 text-sm">
                  <span className="text-muted-foreground">{ADJUSTABLE[key].label}</span>
                  <input
                    type="number"
                    name={key}
                    step="0.05"
                    min="0"
                    max={ADJUSTABLE[key].max}
                    defaultValue={layout[key]}
                    inputMode="decimal"
                    className={FIELD}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          {!fitsPage(layout) && (
            <p className="text-sm text-destructive" role="alert">
              With these measurements the last labels run off the page.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="h-11 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted">
              Update preview
            </button>
            <PrintButton label="Print" className="h-11 rounded-md bg-primary px-4 text-primary-foreground no-underline hover:text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Print on A4 at 100% (&ldquo;Actual size&rdquo;, not &ldquo;Fit to page&rdquo;). To check alignment, print the
            test page on plain paper, hold it against a sticker sheet up to the light, and adjust the margins and gaps.
            Keep the address of this page to reuse the same settings.
          </p>
        </form>
      </div>

      {sheets.length === 0 ? (
        <p className="px-4 pb-8 text-center text-sm text-muted-foreground print:hidden">No scenes match.</p>
      ) : (
        <div className="space-y-6 px-4 pb-8 sm:px-6 print:space-y-0 print:p-0">
          {sheets.map((content, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`0 0 ${A4.width} ${A4.height}`}
              className="label-sheet mx-auto block h-auto w-full max-w-[210mm] bg-white shadow-sm print:h-[297mm] print:w-[210mm] print:max-w-none print:shadow-none"
              role="img"
              aria-label={mode === 'test' ? 'Test page' : `Label sheet ${i + 1} of ${sheets.length}`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
