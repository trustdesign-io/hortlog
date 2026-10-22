import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DWC_LICENCES } from '@/lib/darwin-core'
import { cn } from '@/lib/utils'

/** Download the living collection for GBIF or BGCI PlantSearch */
export function OrgDwcExportCard({ orgSlug, plantCount }: { orgSlug: string; plantCount: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Share with GBIF and BGCI</CardTitle>
        <CardDescription>
          Download your {plantCount} identified plant{plantCount === 1 ? '' : 's'} as a Darwin Core Archive, the
          standard format GBIF and BGCI PlantSearch take. Upload it from your publisher account there; hortlog
          doesn&rsquo;t publish anything itself.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* A plain GET form, so the browser downloads the file */}
        <form action={`/api/export/${orgSlug}/dwc`} method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="dwc-licence" className="text-sm font-medium">
              Licence
            </label>
            <select
              id="dwc-licence"
              name="licence"
              defaultValue="CC-BY"
              className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base sm:h-9 sm:text-sm"
            >
              {Object.entries(DWC_LICENCES).map(([key, l]) => (
                <option key={key} value={key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 sm:h-9')}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Download (.zip)
          </button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Includes each plant&rsquo;s accession number, name and author, family and where it is in the garden.
          Plants not yet identified are left out.
        </p>
      </CardContent>
    </Card>
  )
}
