import { describe, expect, it } from 'vitest'
import { planPhotoPlants } from './photo-layout'

describe('planPhotoPlants', () => {
  it('takes plants with a name and a spot on the photo', () => {
    const r = planPhotoPlants({
      plants: [
        { name: ' Agave americana ', note: 'back left', photo: [0.2, 0.3] },
        { name: 'Plant 2', photo: [0, 1] },
      ],
    })
    expect(r).toEqual({
      ok: true,
      plants: [
        { name: 'Agave americana', note: 'back left', x: 0.2, y: 0.3 },
        { name: 'Plant 2', note: null, x: 0, y: 1 },
      ],
    })
  })

  it('refuses the whole request, listing every problem', () => {
    const r = planPhotoPlants({ plants: [{ name: '', photo: [0.1, 0.1] }, { name: 'Off the photo', photo: [1.2, 0.5] }, { name: 'No spot' }] })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toHaveLength(3)
  })

  it('needs at least one plant', () => {
    expect(planPhotoPlants({}).ok).toBe(false)
    expect(planPhotoPlants({ plants: [] }).ok).toBe(false)
  })
})
