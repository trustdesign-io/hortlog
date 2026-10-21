'use client'

import { useMemo, useState, useTransition } from 'react'
import { regenerateShortCode } from '@/lib/actions/scene'
import { labelUrl, stickerSvg } from '@/lib/sticker-label'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Download, RefreshCw } from 'lucide-react'

interface QRPanelProps {
  orgSlug: string
  sceneId: string
  sceneName: string
  sceneSlug: string
  shortCode: string
  siteUrl: string
  /** The public demo: the code can't be regenerated */
  demo?: boolean
}

/** Pixels for the downloaded PNG: 25 mm at 600 dpi. */
const PNG_PX = 591

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

/** The printable 25 × 25 mm label: hortlog.com, the code, then the scene name. */
export function QRPanel({ orgSlug, sceneId, sceneName, sceneSlug, shortCode, siteUrl, demo = false }: QRPanelProps) {
  const url = labelUrl(siteUrl, shortCode)
  const label = useMemo(() => stickerSvg({ url, name: sceneName, cutLine: true }), [url, sceneName])
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [isRegenerating, startRegenTransition] = useTransition()

  const labelDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(label)}`
  const filename = `hortlog-${sceneSlug}-qr`

  function downloadSvg() {
    const href = URL.createObjectURL(new Blob([label], { type: 'image/svg+xml' }))
    download(href, `${filename}.svg`)
    URL.revokeObjectURL(href)
  }

  function downloadPng() {
    // Draw the same label onto a canvas so the PNG matches the SVG exactly
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = PNG_PX
      canvas.height = PNG_PX
      canvas.getContext('2d')?.drawImage(img, 0, 0, PNG_PX, PNG_PX)
      download(canvas.toDataURL('image/png'), `${filename}.png`)
    }
    img.src = labelDataUrl
  }

  function handleRegenerate() {
    startRegenTransition(async () => {
      const result = await regenerateShortCode(orgSlug, sceneId)
      if (result.success) {
        setRegenOpen(false)
      } else {
        setRegenError(result.error)
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h2 className="font-heading text-base font-medium">QR code</h2>

      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={labelDataUrl}
          alt={`QR code for ${url}, labelled ${sceneName}`}
          width={220}
          height={220}
          className="h-[220px] w-[220px] rounded-lg border"
        />
        <p className="text-center font-mono text-xs text-muted-foreground">{url}</p>
        <p className="text-center text-xs text-muted-foreground">
          Prints at 25 × 25 mm. Downloads are true size (SVG) or 600 dpi (PNG).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={downloadSvg} >
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          SVG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadPng} >
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          PNG
        </Button>
        {demo ? (
          <UnavailableAction reason="Not in the demo: it would stop this scene's printed labels working." className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Regenerate code
          </UnavailableAction>
        ) : (
        <Dialog
          open={regenOpen}
          onOpenChange={(next) => {
            if (next) setRegenError(null)
            setRegenOpen(next)
          }}
        >
          <DialogTrigger render={<Button variant="ghost" size="sm" />}>
            <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Regenerate code
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerate short code?</DialogTitle>
              <DialogDescription>
                This will assign a new short code to this scene. Any QR codes already printed will
                stop working. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {regenError && (
              <p className="text-sm text-destructive" role="alert">
                {regenError}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRegenOpen(false)} disabled={isRegenerating}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRegenerate} disabled={isRegenerating}>
                {isRegenerating ? 'Regenerating…' : 'Regenerate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>
    </div>
  )
}
