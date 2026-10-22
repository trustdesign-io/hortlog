'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { flattenTree, type LocationNode } from '@/lib/locations'

/** The code a garden pastes into its own website to show what's in flower */
export function OrgFloweringEmbedCard({ orgSlug, siteUrl, locations }: { orgSlug: string; siteUrl: string; locations: LocationNode[] }) {
  const [place, setPlace] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const query = place ? `?in=${place}` : ''
  const embed = `<iframe src="${siteUrl}/embed/${orgSlug}/flowering${query}" title="In flower now" width="100%" height="600" style="border:0" loading="lazy"></iframe>`
  const feed = `${siteUrl}/api/feeds/${orgSlug}/flowering${query}`

  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Show what&rsquo;s in flower on your website</CardTitle>
        <CardDescription>
          What your team marks as in flower appears on your own site, kept up to date: paste the code into any page, or
          use the data feed for your own design.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="embed-place" className="text-sm font-medium">
            Where
          </label>
          <select
            id="embed-place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base sm:h-9 sm:text-sm"
          >
            <option value="">The whole garden</option>
            {flattenTree(locations).map((l) => (
              <option key={l.id} value={l.id}>{`${'— '.repeat(l.depth)}${l.name}`}</option>
            ))}
          </select>
        </div>
        {[
          ['embed', 'Code for your website', embed],
          ['feed', 'Data feed (JSON)', feed],
        ].map(([key, label, text]) => (
          <div key={key} className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg border bg-muted/40 p-2 font-mono text-xs">{text}</code>
              <Button type="button" variant="outline" size="icon" aria-label={`Copy ${label.toLowerCase()}`} onClick={() => copy(text, key)}>
                {copied === key ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>
          </div>
        ))}
        <a href={`${siteUrl}/embed/${orgSlug}/flowering${query}`} target="_blank" rel="noopener" className="inline-block text-sm text-primary underline underline-offset-2">
          Preview
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </CardContent>
    </Card>
  )
}
