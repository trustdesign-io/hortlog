import { describe, expect, it } from 'vitest'
import { cleanSceneNote, MAX_SCENE_NOTE } from './scene-notes'

describe('cleanSceneNote', () => {
  it('tidies spaces and keeps paragraphs', () => {
    expect(cleanSceneNote('  Wild yams   feed\r\n\r\n\r\nrural communities ')).toBe('Wild yams feed\n\nrural communities')
  })

  it('refuses empty or over-long notes', () => {
    expect(cleanSceneNote('   ')).toBeNull()
    expect(cleanSceneNote('x'.repeat(MAX_SCENE_NOTE + 1))).toBeNull()
    expect(cleanSceneNote(42)).toBeNull()
  })
})
