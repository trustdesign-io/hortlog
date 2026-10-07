import Image from 'next/image'

interface OrgLogoProps {
  name: string
  logoUrl?: string | null
  size?: number
  className?: string
}

export function OrgLogo({ name, logoUrl, size = 40, className }: OrgLogoProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'cover', borderRadius: 'inherit' }}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))',
        fontSize: size * 0.38,
        fontWeight: 600,
        borderRadius: 'inherit',
        userSelect: 'none',
      }}
    >
      {initials}
    </span>
  )
}
