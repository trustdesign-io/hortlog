import { requireAuth } from '@/lib/auth/permissions'
import { ProfileCard } from './profile-card'
import { AvatarCard } from './avatar-card'
import { PasswordCard } from './password-card'

export const metadata = { title: 'Account settings' }

export default async function SettingsPage() {
  const user = await requireAuth()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, avatar, and password.
        </p>
      </div>
      <AvatarCard user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }} />
      <ProfileCard user={{ name: user.name, email: user.email }} />
      <PasswordCard />
    </div>
  )
}
