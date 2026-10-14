import { Suspense, type ReactNode } from 'react'
import { prisma } from '@/lib/prisma'
import { UTILITY_BAR_CLASS, WeatherBar } from '@/components/weather/weather-bar'

interface OrgLayoutProps {
  children: ReactNode
  params: Promise<{ org: string }>
}

/** Every organisation page gets today's weather for the garden, once it has a postcode. */
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { org: orgSlug } = await params
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { name: true, latitude: true, longitude: true },
  })
  const hasLocation = org?.latitude != null && org?.longitude != null

  return (
    <>
      {hasLocation && (
        // The placeholder holds the bar's space while the forecast loads, so nothing jumps
        <Suspense fallback={<div id="utility-bar" aria-hidden="true" className={UTILITY_BAR_CLASS} />}>
          <WeatherBar latitude={org.latitude!} longitude={org.longitude!} place={org.name} />
        </Suspense>
      )}
      {children}
    </>
  )
}
