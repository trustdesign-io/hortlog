import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { PageTabs } from '@/components/page-tabs'
import { cn } from '@/lib/utils'
import { SceneActiveToggle } from './scene-active-toggle'

interface SceneHeaderProps {
  orgSlug: string
  sceneId: string
  name: string
  /** Optional on-screen title */
  title?: string | null
  collectionName: string | null
  active: 'layout' | 'qr' | 'details'
  /** The scene's public page, as visitors see it */
  publicPath: string
  /** In use at the venue */
  isActive: boolean
}

/** Back link, title, a link to the public page, and the Layout / QR code / Details tabs shared by a scene's pages. */
export function SceneHeader({ orgSlug, sceneId, name, title, collectionName, active, publicPath, isActive }: SceneHeaderProps) {
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
        {/* Phones: the visitor view link sits under the title; wider screens: beside it */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{name}</p>}
            <h1 className="font-heading text-2xl font-medium">{title ?? name}</h1>
            {collectionName && <p className="mt-1 text-sm text-muted-foreground">{collectionName}</p>}
            <div className="mt-2">
              <SceneActiveToggle orgSlug={orgSlug} sceneId={sceneId} active={isActive} />
            </div>
          </div>
          <a
            href={publicPath}
            target="_blank"
            rel="noopener"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
            See what visitors see
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
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
