'use client'

import { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageUploadForm } from '@/components/ui/image-upload-form'
import { uploadAvatarAction } from '@/lib/actions/account'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AvatarCardProps {
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

export function AvatarCard({ user }: AvatarCardProps) {
  const boundAction = useMemo(() => uploadAvatarAction, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Avatar</CardTitle>
        <CardDescription>Displayed next to your name throughout the app.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
            <AvatarFallback className="text-lg">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          {user.avatarUrl && (
            <p className="text-xs text-muted-foreground">Current avatar</p>
          )}
        </div>
        <ImageUploadForm
          action={boundAction}
          fieldName="avatar"
          label="Choose photo"
          hint="PNG, JPEG, or WebP. Max 2 MB."
        />
      </CardContent>
    </Card>
  )
}
