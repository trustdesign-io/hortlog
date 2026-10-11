import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  binomialKey,
  formatRecordDate,
  formatRecordNo,
  licenceUrl,
  parseRecordNumber,
  plantNameHtml,
  renderInline,
  stripTags,
  weekday,
} from './personal-record'

describe('formatRecordNo', () => {
  it('numbers each type on its own, with its prefix', () => {
    expect(formatRecordNo('worked', 7)).toBe('007')
    expect(formatRecordNo('studied', 1)).toBe('S001')
    expect(formatRecordNo('event', 12)).toBe('E012')
    expect(formatRecordNo('day', 1234)).toBe('D1234')
  })
})

describe('formatRecordDate', () => {
  it('reads the calendar date in UTC', () => {
    const d = new Date('2026-10-03T00:00:00Z')
    expect(formatRecordDate(d)).toBe('3 October 2026')
    expect(formatRecordDate(d, 'short')).toBe('3 Oct 2026')
    expect(weekday(d)).toBe('Saturday')
  })
})

describe('renderInline', () => {
  it('italicises botanical names and keeps the authority upright', () => {
    const { container } = render(<p>{renderInline('<i>Aloe arborescens</i> Mill. var. <i>lutea</i>')}</p>)
    const italics = container.querySelectorAll('i')
    expect([...italics].map((i) => i.textContent)).toEqual(['Aloe arborescens', 'lutea'])
    expect(italics[0].getAttribute('lang')).toBe('la')
    expect(container.textContent).toBe('Aloe arborescens Mill. var. lutea')
  })

  it('never outputs other markup', () => {
    const { container } = render(<p>{renderInline('<b>x</b><script>alert(1)</script><i><img src=x>y</i>')}</p>)
    expect(container.querySelector('script, b, img')).toBeNull()
    expect(container.textContent).toBe('xalert(1)y')
  })
})

describe('plantNameHtml', () => {
  it('uses the stored name when there is one', () => {
    expect(plantNameHtml({ nameHtml: '<i>Taxus baccata</i> L.', scientificName: 'Taxus baccata', authority: 'L.' })).toBe(
      '<i>Taxus baccata</i> L.',
    )
  })

  it('builds the name from the scientific name and authority otherwise', () => {
    expect(plantNameHtml({ nameHtml: null, scientificName: 'Taxus baccata', authority: 'L.' })).toBe('<i>Taxus baccata</i> L.')
    expect(plantNameHtml({ nameHtml: null, scientificName: 'Taxus baccata', authority: null })).toBe('<i>Taxus baccata</i>')
  })
})

describe('parseRecordNumber', () => {
  it('accepts positive whole numbers only', () => {
    expect(parseRecordNumber('3')).toBe(3)
    expect(parseRecordNumber('003')).toBe(3)
    expect(parseRecordNumber('0')).toBeNull()
    expect(parseRecordNumber('-1')).toBeNull()
    expect(parseRecordNumber('S001')).toBeNull()
    expect(parseRecordNumber('1e3')).toBeNull()
  })
})

describe('binomialKey', () => {
  it('matches names by genus and species, ignoring tags and case', () => {
    expect(binomialKey('<i>Nesocodon mauritianus</i>')).toBe('nesocodon mauritianus')
    expect(binomialKey('Nesocodon mauritianus (I.Richardson) Thulin')).toBe('nesocodon mauritianus')
    expect(binomialKey('<i>Symphyotrichum</i>')).toBeNull()
  })
})

describe('stripTags and licenceUrl', () => {
  it('strips tags', () => {
    expect(stripTags('<i>Quercus robur</i> L.')).toBe('Quercus robur L.')
  })

  it('links the open licences used for reference photos', () => {
    expect(licenceUrl('CC BY')).toBe('https://creativecommons.org/licenses/by/4.0/')
    expect(licenceUrl('CC0')).toContain('publicdomain/zero')
    expect(licenceUrl('CC BY-NC')).toBeNull()
    expect(licenceUrl(null)).toBeNull()
  })
})
