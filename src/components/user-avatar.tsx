import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

type AvatarUser = Pick<User, 'name' | 'email' | 'avatarUrl'>

export function getInitials(user: AvatarUser): string {
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

interface UserAvatarProps {
  user: AvatarUser
  className?: string
  fallbackClassName?: string
}

/** The member's photo, or their initials when they have none. */
export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
  return (
    <Avatar className={cn('h-8 w-8 shrink-0', className)}>
      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
      <AvatarFallback className={cn('text-xs', fallbackClassName)}>{getInitials(user)}</AvatarFallback>
    </Avatar>
  )
}
