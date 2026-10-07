'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import QRCode from 'qrcode'
import { regenerateShortCode } from '@/lib/actions/view'
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
  viewId: string
  shortCode: string
  siteUrl: string
}

export function QRPanel({ orgSlug, viewId, shortCode, siteUrl }: QRPanelProps) {
  const url = `${siteUrl}/v/${shortCode}`
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [isRegenerating, startRegenTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    QRCode.toString(url, {
      type: 'svg',
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then((svg) => {
      if (!cancelled) {
        setSvgDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
      }
    })
    return () => {
      cancelled = true
    }
  }, [url])

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 1000,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(console.error)
  }, [url])

  function downloadSvg() {
    QRCode.toString(url, {
      type: 'svg',
      width: 1000,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then((svg) => {
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `hortlog-qr-${shortCode}.svg`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  function downloadPng() {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.href = canvasRef.current.toDataURL('image/png')
    a.download = `hortlog-qr-${shortCode}.png`
    a.click()
  }

  function handleRegenerate() {
    startRegenTransition(async () => {
      const result = await regenerateShortCode(orgSlug, viewId)
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
        {svgDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={svgDataUrl}
            alt={`QR code for ${url}`}
            width={200}
            height={200}
            className="rounded-lg border"
          />
        ) : (
          <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-muted" />
        )}
        <p className="text-center font-mono text-xs text-muted-foreground">{url}</p>
      </div>

      {/* Hidden canvas for PNG generation */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={downloadSvg} disabled={!svgDataUrl}>
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          SVG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadPng}>
          <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
          PNG (1000px)
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
                This will assign a new short code to this view. Any QR codes already printed will
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
