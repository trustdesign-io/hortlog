'use client'

import { useActionState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import type { ActionResult } from '@/lib/shared/types'

interface ImageUploadFormProps {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>
  fieldName: string
  label: string
  hint?: string
}

export function ImageUploadForm({ action, fieldName, label, hint }: ImageUploadFormProps) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(action, null)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name={fieldName}
          accept="image/*"
          className="sr-only"
          id={`upload-${fieldName}`}
          aria-label={label}
          disabled={isPending}
        />
        <label
          htmlFor={`upload-${fieldName}`}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {label}
        </label>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {state?.success === false && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state?.success === true && !isPending && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
          Uploaded successfully.
        </p>
      )}
    </form>
  )
}
