import { prisma } from '@/lib/prisma'
import { VISIBLE_SCENE_NOTES } from '@/lib/scene-notes'

/** For visitors: the team's notes on this scene, newest first, like the chalkboards in a bed */
export async function SceneNotes({ sceneId }: { sceneId: string }) {
  const notes = await prisma.sceneNote.findMany({
    where: { sceneId },
    orderBy: { createdAt: 'desc' },
    take: VISIBLE_SCENE_NOTES,
    select: { id: true, text: true, createdAt: true },
  })
  if (notes.length === 0) return null

  return (
    <section aria-labelledby="team-notes" className="space-y-2">
      <h2 id="team-notes" className="font-heading text-lg">
        Notes from the team
      </h2>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="rounded-2xl bg-[#26302B] px-4 py-3 text-[#F5F5EC] shadow-sm">
            <p className="whitespace-pre-line text-base leading-relaxed">{n.text}</p>
            <time dateTime={n.createdAt.toISOString().slice(0, 10)} className="mt-1 block text-xs text-[#C9D3C4]">
              {n.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' })}
            </time>
          </li>
        ))}
      </ul>
    </section>
  )
}
