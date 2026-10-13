import { Suspense, type ReactNode } from 'react'
import { prisma } from '@/lib/prisma'
import { WeatherBar } from '@/components/weather/weather-bar'

interface OrgLayoutProps {
  children: ReactNode
  params: Promise<{ org: string }>
}

/** Every organisation page gets today's weather for the garden, once it has a postcode. */
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { org: orgSlug } = await params
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { latitude: true, longitude: true },
  })
  const hasLocation = org?.latitude != null && org?.longitude != null

  return (
    <>
      {hasLocation && (
        <Suspense fallback={null}>
          <WeatherBar latitude={org.latitude!} longitude={org.longitude!} />
        </Suspense>
      )}
      {children}
    </>
  )
}
