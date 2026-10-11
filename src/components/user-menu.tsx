'use client'

import { useTransition } from 'react'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import type { User } from '@/types'

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <UserAvatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">
          {user.name ?? user.email}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isPending}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        Sign out
      </Button>
    </div>
  )
}
