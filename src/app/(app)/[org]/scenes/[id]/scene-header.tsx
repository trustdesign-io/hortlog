import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { PageTabs } from '@/components/page-tabs'
import { cn } from '@/lib/utils'

interface SceneHeaderProps {
  orgSlug: string
  sceneId: string
  name: string
  collectionName: string | null
  active: 'layout' | 'qr' | 'details'
}

/** Back link, title and the Layout / QR code / Details tabs shared by a scene's pages. */
export function SceneHeader({ orgSlug, sceneId, name, collectionName, active }: SceneHeaderProps) {
  const base = `/${orgSlug}/scenes/${sceneId}`
  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/${orgSlug}/scenes`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to scenes
        </Link>
        <h1 className="font-heading text-2xl font-medium">{name}</h1>
        {collectionName && <p className="mt-1 text-sm text-muted-foreground">{collectionName}</p>}
      </div>
      <PageTabs
        label="Scene"
        active={active}
        tabs={[
          { key: 'layout', label: 'Layout', href: `${base}/edit` },
          { key: 'qr', label: 'QR code', href: `${base}/qr` },
          { key: 'details', label: 'Details', href: `${base}/details` },
        ]}
      />
    </div>
  )
}
