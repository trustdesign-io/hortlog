import { describe, expect, it } from 'vitest'
import { personalGardenName, personalGardenSlug } from './personal-garden'

describe('personal garden', () => {
  it('is named after their first name', () => {
    expect(personalGardenName('Janice Moorekite')).toBe('Janice’s garden')
    expect(personalGardenName(null)).toBe('My garden')
    expect(personalGardenName('  ')).toBe('My garden')
  })

  it('gets a slug with a suffix to keep namesakes apart', () => {
    expect(personalGardenSlug('Janice Moorekite', 'ab12')).toBe('janices-garden-ab12')
    expect(personalGardenSlug(null, 'ab12')).toBe('my-garden-ab12')
    expect(personalGardenSlug('Zoë', 'ab12')).toBe('zoes-garden-ab12')
  })
})
