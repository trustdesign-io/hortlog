import Image from 'next/image'
import { licenceUrl } from '@/lib/personal-record'

export interface ReferencePhotoData {
  photoUrl: string | null
  photoAttribution: string | null
  photoLicence: string | null
  photoSourceUrl: string | null
}

interface ReferencePhotoProps {
  species: ReferencePhotoData
  /** Plain-text species name, for the alt text. */
  name: string
}

const link = 'underline underline-offset-2 hover:text-foreground'

/**
 * A photo of the species from iNaturalist, openly licensed. It is labelled as a
 * reference so it is never mistaken for the plant recorded.
 */
export function ReferencePhoto({ species, name }: ReferencePhotoProps) {
  if (!species.photoUrl) return null
  const licence = licenceUrl(species.photoLicence)
  return (
    <figure className="grid gap-2 border-b border-border py-4 print:hidden">
      <Image
        src={species.photoUrl}
        alt={`${name}, reference photo of the species`}
        width={500}
        height={500}
        sizes="(min-width: 640px) 20rem, 100vw"
        className="h-auto max-h-80 w-auto max-w-full rounded-md border border-border"
      />
      <figcaption className="text-xs leading-snug text-muted-foreground">
        <span className="block font-medium uppercase tracking-wide">Reference photo, not this plant</span>
        {species.photoAttribution}
        {species.photoLicence && (
          <>
            {' · '}
            {licence ? (
              <a href={licence} rel="noopener noreferrer license" target="_blank" className={link}>
                {species.photoLicence}
              </a>
            ) : (
              species.photoLicence
            )}
          </>
        )}
        {species.photoSourceUrl && (
          <>
            {' · via '}
            <a href={species.photoSourceUrl} rel="noopener noreferrer" target="_blank" className={link}>
              iNaturalist
            </a>
          </>
        )}
      </figcaption>
    </figure>
  )
}
