import { NextResponse } from 'next/server'
import { floweringNow } from '@/lib/flowering'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }

interface RouteParams {
  params: Promise<{ org: string }>
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/**
 * What's in flower now, as JSON, for a garden's own website: ?in=<location id>
 * for one place and everywhere inside it. Public, like the flowering page.
 */
export async function GET(req: Request, { params }: RouteParams) {
  const { org: orgSlug } = await params
  const inId = new URL(req.url).searchParams.get('in')
  const data = await floweringNow(orgSlug, inId)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'

  return NextResponse.json(
    {
      garden: { name: data.org.name, url: `${site}/${data.org.slug}/flowering` },
      place: data.place ? { id: data.place.id, name: data.place.name } : null,
      updatedAt: new Date().toISOString(),
      inFlower: data.flowerCount,
      inFruit: data.fruitCount,
      plants: data.groups.flatMap((g) =>
        g.plants.map((p) => ({
          scientificName: p.scientificName,
          commonName: p.commonName === p.scientificName ? null : p.commonName,
          stage: p.stage === 'FLOWER' ? 'in flower' : 'in fruit',
          seenAt: p.seenAt.toISOString().slice(0, 10),
          place: p.places,
          url: `${site}${p.path}`,
          photo: p.photoUrl,
        })),
      ),
    },
    { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } },
  )
}
