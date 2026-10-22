import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Flower2 } from 'lucide-react'
import { floweringNow } from '@/lib/flowering'
import { FloweringList } from '@/components/flowering-list'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface EmbedProps {
  params: Promise<{ org: string }>
  searchParams: Promise<{ in?: string }>
}

/** "In flower now" for a garden's own website, in an iframe. No header or footer. */
export default async function FloweringEmbed({ params, searchParams }: EmbedProps) {
  const { org: orgSlug } = await params
  const data = await floweringNow(orgSlug, (await searchParams).in)
  if (!data) return notFound()
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'
  const total = data.flowerCount + data.fruitCount

  return (
    // data-embed: no cookie banner; data-daylight: always the light theme
    <div data-embed="" data-daylight="" className="space-y-4 bg-background p-4 text-foreground">
      <header className="flex items-center gap-2">
        <Flower2 className="h-5 w-5 text-pink-700" aria-hidden="true" />
        <h1 className="font-heading text-xl leading-tight">
          In flower now{data.place ? ` in ${data.place.name}` : ` at ${data.org.name}`}
        </h1>
      </header>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded in flower in the last three weeks.</p>
      ) : (
        <FloweringList groups={data.groups} linkBase={site} newTab />
      )}
      <p className="text-xs text-muted-foreground">
        Recorded by the garden team ·{' '}
        <a href={site} target="_blank" rel="noopener" className="underline underline-offset-2">
          hortlog
        </a>
      </p>
    </div>
  )
}
