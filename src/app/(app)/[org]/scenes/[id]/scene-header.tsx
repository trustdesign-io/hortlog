import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { PageTabs } from '@/components/page-tabs'
import { cn } from '@/lib/utils'
import { SceneActiveToggle } from './scene-active-toggle'
import { VisitorPreview } from './visitor-preview'
import { UnavailableAction } from '@/components/ui/unavailable-action'

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
  /** The public demo: tabs under /demo, a back link home, and nothing saved */
  demo?: boolean
}

/** Back link, title, a link to the public page, and the Layout / QR code / Details tabs shared by a scene's pages. */
export function SceneHeader({ orgSlug, sceneId, name, title, collectionName, active, publicPath, isActive, demo = false }: SceneHeaderProps) {
  const base = demo ? '/demo' : `/${orgSlug}/scenes/${sceneId}`
  return (
    <div className="space-y-4">
      <div>
        {demo ? (
          <UnavailableAction
            reason="The demo shows one scene. In hortlog this goes back to all of them."
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Back to scenes
          </UnavailableAction>
        ) : (
          <Link
            href={`/${orgSlug}/scenes`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Back to scenes
          </Link>
        )}
        {title && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{name}</p>}
        <h1 className="font-heading text-2xl font-medium">{title ?? name}</h1>
        {collectionName && <p className="mt-1 text-sm text-muted-foreground">{collectionName}</p>}
        {/* Whether it's live, and how it looks to visitors, side by side */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <SceneActiveToggle orgSlug={orgSlug} sceneId={sceneId} active={isActive} demo={demo} />
          <VisitorPreview publicPath={publicPath} />
        </div>
      </div>
      <PageTabs
        label="Scene"
        active={active}
        tabs={[
          { key: 'layout', label: 'Layout', href: demo ? base : `${base}/edit` },
          { key: 'qr', label: 'QR code', href: `${base}/qr` },
          { key: 'details', label: 'Details', href: `${base}/details` },
        ]}
      />
    </div>
  )
}
