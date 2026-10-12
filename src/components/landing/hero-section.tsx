import type { ReactNode } from 'react'
import Image, { getImageProps } from 'next/image'
import { cn } from '@/lib/utils'

export interface HeroImageMedia {
  type: 'image'
  src: string
  /** Phone crop shown below sm (640 px). When present a <picture> is used so
   *  only one image downloads per viewport width. */
  phoneSrc?: string
  /** Pixel dimensions of src — required when phoneSrc is provided. */
  srcWidth?: number
  srcHeight?: number
  /** Pixel dimensions of phoneSrc — required when phoneSrc is provided. */
  phoneSrcWidth?: number
  phoneSrcHeight?: number
  alt: string
  sizes?: string
}

export interface HeroVideoMedia {
  type: 'video'
  src: string
  poster: string
  posterSizes?: string
}

export type HeroMedia = HeroImageMedia | HeroVideoMedia

interface HeroSectionProps {
  heading: ReactNode
  body: ReactNode
  actions: ReactNode
  backgroundMedia?: HeroMedia
  className?: string
}

export function HeroSection({
  heading,
  body,
  actions,
  backgroundMedia,
  className,
}: HeroSectionProps) {
  const hasMedia = !!backgroundMedia

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden',
        // Vertical padding: ~96px mobile, ~160px md+
        'py-24 md:py-40',
        // Min-height: 70vh on md+ so the hero reads as a full section
        'md:min-h-[70vh]',
        // Flex to vertically centre content on desktop
        'flex items-center',
        className,
      )}
    >
      {/* Background media */}
      {hasMedia && (
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {backgroundMedia.type === 'image' ? (
            backgroundMedia.phoneSrc ? (
              <ResponsiveHeroImage
                src={backgroundMedia.src}
                phoneSrc={backgroundMedia.phoneSrc}
                srcWidth={backgroundMedia.srcWidth ?? 1680}
                srcHeight={backgroundMedia.srcHeight ?? 720}
                phoneSrcWidth={backgroundMedia.phoneSrcWidth ?? 960}
                phoneSrcHeight={backgroundMedia.phoneSrcHeight ?? 1200}
                alt={backgroundMedia.alt}
              />
            ) : (
              <Image
                src={backgroundMedia.src}
                alt={backgroundMedia.alt}
                fill
                className="object-cover"
                sizes={backgroundMedia.sizes ?? '100vw'}
                priority
              />
            )
          ) : (
            <>
              {/* Poster shown when reduced motion is preferred; video shown otherwise */}
              <Image
                src={backgroundMedia.poster}
                alt=""
                fill
                className="object-cover motion-safe:hidden"
                sizes={backgroundMedia.posterSizes ?? '100vw'}
                priority
              />
              <video
                className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
                src={backgroundMedia.src}
                poster={backgroundMedia.poster}
                autoPlay
                muted
                loop
                playsInline
              />
            </>
          )}
          {/* Overlay to keep text readable at WCAG AA contrast over any media.
              bg-black/60 ensures normal-weight body text (#fff on ~#404040 composite) clears 4.5:1. */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative z-10 w-full px-6',
          'max-w-3xl mx-auto text-center',
          hasMedia && 'text-white',
        )}
      >
        {heading}
        {body}
        {actions}
      </div>
    </section>
  )
}

interface ResponsiveHeroImageProps {
  src: string
  phoneSrc: string
  srcWidth: number
  srcHeight: number
  phoneSrcWidth: number
  phoneSrcHeight: number
  alt: string
}

/** Renders a <picture> that serves the phone crop on viewports < 640 px
 *  and the wide crop on larger screens. Both sources go through Next.js
 *  image optimisation (AVIF / WebP), so only one image downloads. */
function ResponsiveHeroImage({
  src,
  phoneSrc,
  srcWidth,
  srcHeight,
  phoneSrcWidth,
  phoneSrcHeight,
  alt,
}: ResponsiveHeroImageProps) {
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({
    src,
    alt,
    width: srcWidth,
    height: srcHeight,
    sizes: '100vw',
    priority: true,
    quality: 85,
  })

  const {
    props: { srcSet: phoneSrcSet, src: phoneSrcFallback },
  } = getImageProps({
    src: phoneSrc,
    alt,
    width: phoneSrcWidth,
    height: phoneSrcHeight,
    sizes: '100vw',
    priority: true,
    quality: 85,
  })

  return (
    <picture>
      {/* Wide crop on sm and above (640 px+) */}
      <source media="(min-width: 640px)" srcSet={wideSrcSet} sizes="100vw" />
      {/* Phone crop is the <img> fallback — also used on narrow viewports */}
      <img
        src={phoneSrcFallback}
        srcSet={phoneSrcSet}
        alt={alt}
        sizes="100vw"
        decoding="async"
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </picture>
  )
}
