import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface HeroImageMedia {
  type: 'image'
  src: string
  alt: string
  sizes?: string
}

export interface HeroVideoMedia {
  type: 'video'
  src: string
  poster: string
}

export type HeroMedia = HeroImageMedia | HeroVideoMedia

interface HeroSectionProps {
  heading: React.ReactNode
  body: React.ReactNode
  actions: React.ReactNode
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
            <Image
              src={backgroundMedia.src}
              alt={backgroundMedia.alt}
              fill
              className="object-cover"
              sizes={backgroundMedia.sizes ?? '100vw'}
              priority
            />
          ) : (
            <>
              {/* Poster shown when reduced motion is preferred; video shown otherwise */}
              <Image
                src={backgroundMedia.poster}
                alt=""
                fill
                className="object-cover motion-safe:hidden"
                sizes="100vw"
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
          {/* Overlay to keep text readable at WCAG AA contrast over any media */}
          <div className="absolute inset-0 bg-black/45" />
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
