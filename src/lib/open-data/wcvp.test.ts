import { describe, expect, it } from 'vitest'
import { ipniFromIdentifiers, readMatch } from './wcvp'

describe('readMatch', () => {
  it('reads an accepted name', () => {
    const r = readMatch({ type: 'exact', usage: { id: '1', name: 'Didierea trollii', authorship: 'Capuron & Rauh', status: 'accepted' } })
    expect(r?.status).toBe('accepted')
    expect(r?.accepted?.name).toBe('Didierea trollii')
  })

  it('finds the accepted taxon of a synonym', () => {
    const r = readMatch({
      type: 'variant',
      usage: {
        id: '2680246',
        name: 'Borzicactus strausii',
        status: 'synonym',
        classification: [
          { id: '2725469', name: 'Cleistocactus strausii', authorship: '(Heese) Backeb.', status: 'accepted' },
          { id: '2725338', name: 'Cleistocactus', status: 'accepted' },
        ],
      },
    })
    expect(r?.status).toBe('synonym')
    expect(r?.accepted?.name).toBe('Cleistocactus strausii')
  })

  it('treats no match as not in the checklist, and an unreachable service as unknown', () => {
    expect(readMatch({ type: 'none' })?.status).toBe('not-found')
    expect(readMatch(null)).toBeNull()
  })
})

describe('ipniFromIdentifiers', () => {
  it('picks the IPNI id', () => {
    expect(ipniFromIdentifiers(['tpl:x', 'ipni:60254-2'])).toBe('60254-2')
    expect(ipniFromIdentifiers(undefined)).toBeNull()
  })
})
