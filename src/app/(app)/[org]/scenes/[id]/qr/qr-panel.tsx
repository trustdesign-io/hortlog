'use client'

import { useEffect, useState, useTransition } from 'react'
import QRCode from 'qrcode'
import { regenerateShortCode } from '@/lib/actions/scene'
import { labelSvg, QR_MARGIN } from '@/lib/qr-label'
import { Button } from '@/components/ui/button'
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
}

const QR_OPTIONS = { margin: QR_MARGIN, color: { dark: '#000000', light: '#ffffff' } }

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

/** The printable label: the code with a white border and the scene name beneath. */
export function QRPanel({ orgSlug, sceneId, sceneName, sceneSlug, shortCode, siteUrl }: QRPanelProps) {
  const url = `${siteUrl}/v/${shortCode}`
  const [label, setLabel] = useState<string | null>(null)
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [isRegenerating, startRegenTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    QRCode.toString(url, { type: 'svg', ...QR_OPTIONS }).then((qr) => {
      if (!cancelled) setLabel(labelSvg(qr, sceneName))
    })
    return () => {
      cancelled = true
    }
  }, [url, sceneName])

  const labelDataUrl = label ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(label)}` : null
  const filename = `hortlog-${sceneSlug}-qr`

  function downloadSvg() {
    if (!label) return
    const href = URL.createObjectURL(new Blob([label], { type: 'image/svg+xml' }))
    download(href, `${filename}.svg`)
    URL.revokeObjectURL(href)
  }

  function downloadPng() {
    if (!labelDataUrl) return
    // Draw the same label onto a canvas so the PNG matches the SVG exactly
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')?.drawImage(img, 0, 0)
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
        {labelDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={labelDataUrl}
            alt={`QR code for ${url}, labelled ${sceneName}`}
            width={220}
            className="h-auto w-[220px] rounded-lg border"
          />
        ) : (
          <div className="h-[250px] w-[220px] animate-pulse rounded-lg bg-muted" />
        )}
        <p className="text-center font-mono text-xs text-muted-foreground">{url}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={downloadSvg} disabled={!label}>
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          SVG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadPng} disabled={!label}>
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          PNG
        </Button>
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
      </div>
    </div>
  )
}
