import Image from 'next/image'
import { Leaf } from 'lucide-react'

interface SpecimenImageProps {
  imageUrl?: string | null
  alt: string
  size?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
}

export function SpecimenImage({
  imageUrl,
  alt,
  size = 80,
  fill = false,
  sizes,
  priority = false,
  className,
}: SpecimenImageProps) {
  if (imageUrl) {
    if (fill) {
      return (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes ?? '(max-width: 640px) calc(100vw - 2rem), 640px'}
          priority={priority}
          className={className}
          style={{ objectFit: 'cover', borderRadius: 'inherit' }}
        />
      )
    }

    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
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
        width: fill ? '100%' : size,
        height: fill ? '100%' : size,
        background: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))',
        borderRadius: 'inherit',
      }}
    >
      <Leaf
        style={{ width: fill ? '45%' : size * 0.45, height: fill ? '45%' : size * 0.45 }}
        aria-hidden="true"
      />
    </span>
  )
}
