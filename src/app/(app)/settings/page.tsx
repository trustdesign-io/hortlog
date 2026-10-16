import { requireAuth } from '@/lib/auth/permissions'
import { ProfileCard } from './profile-card'
import { AvatarCard } from './avatar-card'
import { PasswordCard } from './password-card'
import { PublicRecordCard } from './public-record-card'
import { PlantCreditCard } from './plant-credit-card'
import { ApiKeysCard } from './api-keys-card'
import { prisma } from '@/lib/prisma'
import { hasCapability } from '@/lib/auth/capabilities'
import { suggestUsername } from '@/lib/public-record'

export const metadata = { title: 'Account settings' }

export default async function SettingsPage() {
  const user = await requireAuth()
  // Keys are for laying out scenes, so only for people who can edit them
  const editsScenes = user.isAdmin || user.memberships.some((m) => hasCapability(m.role, 'can_edit_scene'))
  const keys = editsScenes
    ? await prisma.apiKey.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, public record, plant credits, avatar and password.
        </p>
      </div>
      <AvatarCard user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }} />
      <ProfileCard user={{ name: user.name, email: user.email }} />
      <PublicRecordCard
        username={user.username}
        suggestedUsername={suggestUsername(user.name, user.email)}
        recordPublic={user.recordPublic}
        recordShowNotes={user.recordShowNotes}
      />
      <PlantCreditCard creditOnPlants={user.creditOnPlants} />
      {editsScenes && (
        <ApiKeysCard
          keys={keys.map((k) => ({ ...k, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null }))}
        />
      )}
      <PasswordCard />
    </div>
  )
}
