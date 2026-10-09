'use client'

import { useTransition, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { adminDeleteUser } from '@/lib/actions/admin'

interface MemberDeleteDialogProps {
  userId: string
  userName: string
  workRecordCount: number
}

export function MemberDeleteDialog({ userId, userName, workRecordCount }: MemberDeleteDialogProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await adminDeleteUser(userId)
      if (result && !result.success) setError(result.error ?? 'Something went wrong.')
    })
  }

  const recordsNote = workRecordCount > 0
    ? ` Their ${workRecordCount} work record${workRecordCount === 1 ? '' : 's'} will also be permanently deleted.`
    : ''

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${userName}`}
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete <strong>{userName}</strong>? Their account will be removed and they will
            no longer be able to sign in.{recordsNote} Tasks and edits they created will remain, attributed
            to &ldquo;Former member&rdquo;. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
