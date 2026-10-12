import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { isAdmin: true } })
  if (!dbUser?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Find all scenes that have no zones
  const scenesWithoutZones = await prisma.scene.findMany({
    where: { zones: { none: {} } },
    select: { id: true, gridRows: true, gridCols: true },
    take: 1000,
  })

  if (scenesWithoutZones.length === 0) {
    return NextResponse.json({ message: 'All scenes already have zones.', created: 0 })
  }

  let created = 0
  let moved = 0

  for (const scene of scenesWithoutZones) {
    const zone = await prisma.sceneZone.create({
      data: { name: 'Bed', type: 'BED', rows: scene.gridRows, cols: scene.gridCols, position: 0, sceneId: scene.id },
      select: { id: true },
    })
    // Move all placed specimens in this scene into the new zone
    const { count } = await prisma.specimen.updateMany({
      where: { sceneId: scene.id, zoneId: null },
      data: { zoneId: zone.id },
    })
    created++
    moved += count
  }

  return NextResponse.json({ message: `Backfill complete.`, created, moved })
}
