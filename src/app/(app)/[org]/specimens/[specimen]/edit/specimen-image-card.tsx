'use client'

import { useMemo } from 'react'
import { uploadSpecimenImageAction } from '@/lib/actions/specimen'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { ImageUploadForm } from '@/components/ui/image-upload-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SpecimenImageCardProps {
  orgSlug: string
  specimenId: string
  commonName: string
  imageUrl: string | null
}

export function SpecimenImageCard({
  orgSlug,
  specimenId,
  commonName,
  imageUrl,
}: SpecimenImageCardProps) {
  const boundAction = useMemo(
    () => uploadSpecimenImageAction.bind(null, orgSlug, specimenId),
    [orgSlug, specimenId],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Photo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-24 w-24 overflow-hidden rounded-xl border bg-muted">
          <SpecimenImage imageUrl={imageUrl} alt={commonName} size={96} />
        </div>
        <ImageUploadForm
          action={boundAction}
          fieldName="image"
          label="Choose photo"
          hint="PNG, JPEG, or WebP. Max 2 MB."
        />
      </CardContent>
    </Card>
  )
}
