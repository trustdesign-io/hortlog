import { describe, expect, it } from 'vitest'
import { likedByLine } from './likes'

describe('likedByLine', () => {
  it('names up to three people, then counts the rest', () => {
    expect(likedByLine([])).toBeNull()
    expect(likedByLine(['Simone'])).toBe('Liked by Simone')
    expect(likedByLine(['Simone', 'Tom'])).toBe('Liked by Simone and Tom')
    expect(likedByLine(['Simone', 'Tom', 'Ana'])).toBe('Liked by Simone, Tom and Ana')
    expect(likedByLine(['Simone', 'Tom', 'Ana', 'Raj', 'Lee'])).toBe('Liked by Simone, Tom and 3 others')
  })
})
