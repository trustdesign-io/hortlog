import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Leaf } from 'lucide-react'
import { floweringNow } from '@/lib/flowering'
import { FloweringList } from '@/components/flowering-list'
import { GaEvent } from '@/components/ga-event'

interface FloweringPageProps {
  params: Promise<{ org: string }>
  /** `in`: a location id, to show that place and everywhere inside it */
  searchParams: Promise<{ in?: string }>
}

export async function generateMetadata({ params, searchParams }: FloweringPageProps) {
  const { org: orgSlug } = await params
  const data = await floweringNow(orgSlug, (await searchParams).in)
  if (!data) return {}
  const where = data.place?.name ?? data.org.name
  return {
    title: `In flower now — ${where}`,
    description: `What’s flowering and fruiting at ${where} this week, recorded by the garden team.`,
  }
}

/** What's in flower and fruit now, by place, as recorded by the garden's team. */
export default async function FloweringPage({ params, searchParams }: FloweringPageProps) {
  const { org: orgSlug } = await params
  const data = await floweringNow(orgSlug, (await searchParams).in)
  if (!data) return notFound()
  const { org, place, groups, flowerCount, fruitCount } = data

  return (
    <div data-daylight="" className="mx-auto max-w-2xl space-y-5 px-4 pb-10 pt-4 sm:px-6">
      <GaEvent name="flowering_view" params={{ org: orgSlug, location: place?.id ?? 'all' }} />
      <header className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Leaf className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{org.name}</span>
        </p>
        <h1 className="font-heading text-2xl leading-tight text-balance sm:text-3xl">
          In flower now{place ? ` in ${place.name}` : ''}
        </h1>
        <p className="text-base text-muted-foreground">
          {flowerCount + fruitCount === 0
            ? 'Nothing has been recorded in flower here in the last three weeks.'
            : `${flowerCount} in flower${fruitCount > 0 ? `, ${fruitCount} in fruit` : ''}, recorded by the garden team in the last three weeks.`}
        </p>
        {place && (
          <Link href={`/${org.slug}/flowering`} className="inline-block text-sm text-primary underline underline-offset-2">
            Everywhere at {org.name}
          </Link>
        )}
      </header>
      <FloweringList groups={groups} />
    </div>
  )
}
