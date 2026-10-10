import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { PersonalRecordSection } from './personal-record-section'

describe('PersonalRecordSection', () => {
  it('renders the heading as a labelled section', () => {
    render(<PersonalRecordSection />)
    expect(screen.getByRole('region', { name: 'Your work, on the record' })).toBeInTheDocument()
  })

  it('lists the three points as h3s', () => {
    render(<PersonalRecordSection />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual([
      'A record that builds itself',
      'Kept to a professional standard',
      'Show it to employers',
    ])
  })

  it('links the call to action to sign-up', () => {
    render(<PersonalRecordSection />)
    expect(screen.getByRole('link', { name: 'Start your record' })).toHaveAttribute('href', '/sign-up')
  })

  it('marks the example record as an example and italicises botanical names only', () => {
    render(<PersonalRecordSection />)
    const figure = screen.getByRole('figure')
    expect(within(figure).getByText('Example')).toBeInTheDocument()
    const name = within(figure).getByText('Echium pininana')
    expect(name).toHaveClass('italic')
    expect(within(figure).getByText('Webb & Berthel.')).not.toHaveClass('italic')
  })
})
