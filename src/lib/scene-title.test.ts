import { describe, expect, it } from 'vitest'
import { MAX_SCENE_TITLE, parseSceneTitle } from './scene-title'

describe('parseSceneTitle', () => {
  it('tidies spaces and treats blank as none', () => {
    expect(parseSceneTitle('  Cactus   bed ')).toEqual({ ok: true, title: 'Cactus bed' })
    expect(parseSceneTitle('   ')).toEqual({ ok: true, title: null })
  })
  it('refuses a title that is too long', () => {
    expect(parseSceneTitle('x'.repeat(MAX_SCENE_TITLE + 1))).toEqual({ ok: false })
  })
})
