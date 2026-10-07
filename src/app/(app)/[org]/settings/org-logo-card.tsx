'use client'

import { useMemo } from 'react'
import { uploadOrgLogoAction } from '@/lib/actions/org'
import { OrgLogo } from '@/components/ui/org-logo'
import { ImageUploadForm } from '@/components/ui/image-upload-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OrgLogoCardProps {
  orgSlug: string
  orgName: string
  logoUrl: string | null
}

export function OrgLogoCard({ orgSlug, orgName, logoUrl }: OrgLogoCardProps) {
  const boundAction = useMemo(
    () => uploadOrgLogoAction.bind(null, orgSlug),
    [orgSlug],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organisation logo</CardTitle>
        <CardDescription>Displayed on your public pages and in the app.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-xl border bg-muted">
            <OrgLogo name={orgName} logoUrl={logoUrl} size={64} />
          </div>
          {logoUrl && (
            <p className="text-xs text-muted-foreground">Current logo</p>
          )}
        </div>
        <ImageUploadForm
          action={boundAction}
          fieldName="logo"
          label="Choose image"
          hint="PNG, JPEG, or WebP. Max 2 MB."
        />
      </CardContent>
    </Card>
  )
}
