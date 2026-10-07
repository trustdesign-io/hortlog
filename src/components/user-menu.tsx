'use client'

import { useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import type { User } from '@/types'

interface UserMenuProps {
  user: User
}

function getInitials(user: User): string {
  if (user.name) {
    return user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.email.slice(0, 2).toUpperCase()
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
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={user.avatarUrl ?? undefined}
          alt={user.name ?? user.email}
        />
        <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">
          {user.name ?? 'User'}
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
