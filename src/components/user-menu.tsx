'use client'

import { useTransition } from 'react'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import { listOutbox } from '@/lib/offline/db'
import { isUnsent } from '@/lib/offline/ops'
import { countUnsentScenePhotos, sendScenePhotos } from '@/lib/offline/scene-photos'
import { clearOfflineData, flushOutbox } from '@/lib/offline/sync'
import type { User } from '@/types'

interface UserMenuProps {
  user: User
}

interface SignOutButtonProps {
  className?: string
  size?: 'sm' | 'lg'
  variant?: 'ghost' | 'outline'
}

export function SignOutButton({ className, size = 'sm', variant = 'ghost' }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      // Changes made offline are lost on sign-out, so send them first
      const unsent =
        (await flushOutbox().then(() => listOutbox()).catch(() => [])).filter(isUnsent).length +
        (await sendScenePhotos().then(countUnsentScenePhotos).catch(() => 0))
      if (
        unsent > 0 &&
        !window.confirm(
          `${unsent} change${unsent === 1 ? '' : 's'} made offline ${unsent === 1 ? 'hasn’t' : 'haven’t'} been sent yet. Signing out deletes ${unsent === 1 ? 'it' : 'them'}. Sign out anyway?`,
        )
      ) {
        return
      }
      // The device's offline copy belongs to this member
      await clearOfflineData()
      await signOut()
    })
  }

  return (
    <Button variant={variant} size={size} onClick={handleSignOut} disabled={isPending} className={className}>
      Sign out
    </Button>
  )
}

/** Avatar, name and email, centred: the head of the mobile You panel. */
export function UserIdentity({ user }: UserMenuProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 text-center">
      <UserAvatar user={user} className="h-16 w-16" fallbackClassName="text-lg" />
      <div className="min-w-0 max-w-full">
        <p className="truncate font-medium">{user.name ?? user.email}</p>
        {user.name && <p className="truncate text-sm text-muted-foreground">{user.email}</p>}
      </div>
    </div>
  )
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <UserAvatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">
          {user.name ?? user.email}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <SignOutButton className="shrink-0 text-muted-foreground hover:text-foreground" />
    </div>
  )
}
