import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import rawCss from '../app/globals.css?raw'

const meta: Meta = {
  title: 'Brand/Tokens',
  parameters: {
    layout: 'padded',
  },
}

export default meta

type Story = StoryObj

// ─── Colour palette discovery ────────────────────────────────────────────────

type Swatch = { shade: string; value: string }

function parseColorPalettes(): Map<string, Swatch[]> {
  const tokenMap = new Map<string, Swatch[]>()
  const pattern = /--color-(.+?)-(\d+)\s*:\s*(#[0-9a-fA-F]{3,8})/g

  let match: RegExpExecArray | null
  while ((match = pattern.exec(rawCss)) !== null) {
    const [, scale, shade, value] = match
    if (!tokenMap.has(scale)) tokenMap.set(scale, [])
    tokenMap.get(scale)!.push({ shade, value })
  }

  tokenMap.forEach(shades => shades.sort((a, b) => Number(a.shade) - Number(b.shade)))
  return new Map([...tokenMap].sort(([a], [b]) => a.localeCompare(b)))
}

const COLOR_PALETTES = parseColorPalettes()

// ─── Colour components ───────────────────────────────────────────────────────

function SwatchRow({ scale, swatches }: { scale: string; swatches: Swatch[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold capitalize">{scale.replace(/-/g, ' ')}</h3>
      <div className="flex flex-wrap gap-3">
        {swatches.map(({ shade, value }) => (
          <div key={shade} className="flex flex-col gap-1 w-20">
            <div
              className="h-12 w-full rounded-lg border border-border"
              style={{ background: value }}
            />
            <p className="text-xs font-medium leading-tight">{shade}</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const SEMANTIC_COLORS = [
  { label: 'background', token: '--background' },
  { label: 'foreground', token: '--foreground' },
  { label: 'primary', token: '--primary' },
  { label: 'primary-foreground', token: '--primary-foreground' },
  { label: 'secondary', token: '--secondary' },
  { label: 'secondary-foreground', token: '--secondary-foreground' },
  { label: 'muted', token: '--muted' },
  { label: 'muted-foreground', token: '--muted-foreground' },
  { label: 'accent', token: '--accent' },
  { label: 'accent-foreground', token: '--accent-foreground' },
  { label: 'destructive', token: '--destructive' },
  { label: 'border', token: '--border' },
  { label: 'input', token: '--input' },
  { label: 'ring', token: '--ring' },
]

function SemanticSwatchRow() {
  return (
    <div className="flex flex-wrap gap-3">
      {SEMANTIC_COLORS.map(({ label, token }) => (
        <div key={token} className="flex flex-col gap-1 w-24">
          <div
            className="h-14 w-full rounded-lg border border-border shadow-sm"
            style={{ background: `var(${token})` }}
          />
          <p className="text-xs font-medium leading-tight">{label}</p>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{token}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Typography specimens ────────────────────────────────────────────────────

const TYPE_SCALE = [
  { label: 'Display', className: 'text-4xl font-bold', specimen: 'Build faster.' },
  { label: 'Heading 1', className: 'text-3xl font-semibold', specimen: 'Platform overview' },
  { label: 'Heading 2', className: 'text-2xl font-semibold', specimen: 'Active projects' },
  { label: 'Heading 3', className: 'text-xl font-medium', specimen: 'Team settings' },
  { label: 'Heading 4', className: 'text-base font-medium', specimen: 'Billing details' },
  { label: 'Body', className: 'text-base', specimen: 'The quick brown fox jumps over the lazy dog.' },
  { label: 'Body SM', className: 'text-sm', specimen: 'The quick brown fox jumps over the lazy dog.' },
  { label: 'Caption', className: 'text-xs text-muted-foreground', specimen: 'Last updated 2 minutes ago' },
  { label: 'Mono', className: 'text-sm font-mono', specimen: 'const greeting = "hello, world"' },
]

// ─── Stories ─────────────────────────────────────────────────────────────────

export const AllColourPalettes: Story = {
  name: 'Colour — All Palettes',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-base font-semibold mb-1">Colour palettes</h2>
        <p className="text-sm text-muted-foreground mb-6">
          All <code className="font-mono text-xs">--color-*</code> scales parsed from globals.css.
          Scales are grouped and sorted automatically — no hardcoding required.
        </p>
        <div className="flex flex-col gap-8">
          {Array.from(COLOR_PALETTES.entries()).map(([scale, swatches]) => (
            <SwatchRow key={scale} scale={scale} swatches={swatches} />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const SemanticColors: Story = {
  name: 'Colour — Semantic Tokens',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Semantic tokens</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Role-based tokens mapped from the active brand palette. Values reflect the current theme (light/dark).
        </p>
        <SemanticSwatchRow />
      </div>
    </div>
  ),
}

export const Typography: Story = {
  name: 'Typography — Type Scale',
  render: () => (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold mb-4">Type scale</h2>
        <div className="flex flex-col gap-6 divide-y divide-border">
          {TYPE_SCALE.map(({ label, className, specimen }) => (
            <div key={label} className="pt-4 first:pt-0 flex items-baseline gap-6">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
              <span className={className}>{specimen}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

export const RadiusScale: Story = {
  name: 'Radius — Scale',
  render: () => {
    const radii = [
      { label: 'sm', cls: 'rounded-sm' },
      { label: 'md', cls: 'rounded-md' },
      { label: 'lg', cls: 'rounded-lg' },
      { label: 'xl', cls: 'rounded-xl' },
      { label: '2xl', cls: 'rounded-2xl' },
      { label: '3xl', cls: 'rounded-3xl' },
      { label: 'full', cls: 'rounded-full' },
    ]
    return (
      <div>
        <h2 className="text-base font-semibold mb-4">Border radius</h2>
        <div className="flex flex-wrap gap-4 items-end">
          {radii.map(({ label, cls }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 bg-primary ${cls}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
