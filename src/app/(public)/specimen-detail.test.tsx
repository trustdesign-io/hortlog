import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Plain <img>: the test has no Next.js image config
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, className } = props as { src: string; alt: string; className?: string }
    // eslint-disable-next-line @next/next/no-img-element -- stand-in for next/image
    return <img src={src} alt={alt} className={className} />
  },
}))
import { SpecimenDetail } from './specimen-detail'

const species = {
  commonName: 'Common houseleek',
  scientificName: 'Sempervivum tectorum',
  family: 'Crassulaceae',
  origin: 'Europe',
  description: 'A rosette-forming succulent.',
  conservationStatus: 'LC',
  photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/1/medium.jpg',
  photoAttribution: 'A. Person',
  photoLicence: 'CC-BY',
  photoSourceUrl: 'https://www.inaturalist.org/photos/1',
}

function renderDetail() {
  return render(
    <SpecimenDetail
      species={species}
      specimen={{ accessionNumber: '2026.014', notes: null, imageUrl: null, cultivar: 'Royanum' }}
      backHref="/x/scene/scene-001"
      backLabel="Cactus bed"
    />,
  )
}

describe('SpecimenDetail for screen readers', () => {
  it('has one heading with both names and the cultivar', () => {
    renderDetail()
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/Sempervivum tectorum.*cultivar.*Royanum.*Common houseleek/)
  })

  it('says where Back goes', () => {
    renderDetail()
    expect(screen.getByRole('link', { name: 'Back to Cactus bed' })).toBeInTheDocument()
  })

  it('reads the accession number and status in words', () => {
    renderDetail()
    expect(screen.getByText(/Accession number/)).toBeInTheDocument()
    expect(screen.getByText(/Conservation status:/)).toBeInTheDocument()
  })

  it('describes the reference photo and warns of new tabs', () => {
    renderDetail()
    expect(screen.getByRole('img', { name: /Reference photo of Common houseleek/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /iNaturalist \(opens in a new tab\)/ })).toBeInTheDocument()
  })

  it('has a heading for the details', () => {
    renderDetail()
    expect(screen.getByRole('heading', { level: 2, name: 'About this plant' })).toBeInTheDocument()
  })
})
