import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'hortlog — Horticultural tools for gardens and woodlands'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#0c1a0c',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px',
      }}
    >
      <p
        style={{
          color: '#6aaa6a',
          fontSize: 22,
          margin: '0 0 20px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontFamily: 'serif',
        }}
      >
        hortlog
      </p>
      <h1
        style={{
          color: '#eef4ee',
          fontSize: 58,
          lineHeight: 1.2,
          margin: 0,
          maxWidth: 850,
          fontFamily: 'serif',
          fontWeight: 600,
        }}
      >
        Horticultural tools for gardens and woodlands
      </h1>
      <p
        style={{
          color: '#7a9e7a',
          fontSize: 26,
          margin: '28px 0 0',
          maxWidth: 720,
          fontFamily: 'sans-serif',
        }}
      >
        A living record for botanical collections.
      </p>
    </div>,
    { ...size },
  )
}
