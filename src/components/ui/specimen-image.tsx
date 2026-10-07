import Image from 'next/image'
import { Leaf } from 'lucide-react'

interface SpecimenImageProps {
  imageUrl?: string | null
  alt: string
  size?: number
  className?: string
}

export function SpecimenImage({ imageUrl, alt, size = 80, className }: SpecimenImageProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
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
      aria-label={alt}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))',
        borderRadius: 'inherit',
      }}
    >
      <Leaf style={{ width: size * 0.45, height: size * 0.45 }} aria-hidden="true" />
    </span>
  )
}
