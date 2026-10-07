import { describe, it, expect } from 'vitest'
import { hasCapability, CAPABILITIES } from './capabilities'

describe('hasCapability', () => {
  describe('MANAGER role', () => {
    it('can edit specimens', () => {
      expect(hasCapability('MANAGER', 'can_edit_specimen')).toBe(true)
    })

    it('can edit views', () => {
      expect(hasCapability('MANAGER', 'can_edit_view')).toBe(true)
    })

    it('can manage members', () => {
      expect(hasCapability('MANAGER', 'can_manage_members')).toBe(true)
    })

    it('can edit org settings', () => {
      expect(hasCapability('MANAGER', 'can_edit_org_settings')).toBe(true)
    })

    it('cannot manage species (admin only)', () => {
      expect(hasCapability('MANAGER', 'can_manage_species')).toBe(false)
    })
  })

  describe('MEMBER role', () => {
    it('can edit specimens', () => {
      expect(hasCapability('MEMBER', 'can_edit_specimen')).toBe(true)
    })

    it('can edit views', () => {
      expect(hasCapability('MEMBER', 'can_edit_view')).toBe(true)
    })

    it('cannot manage members', () => {
      expect(hasCapability('MEMBER', 'can_manage_members')).toBe(false)
    })

    it('cannot edit org settings', () => {
      expect(hasCapability('MEMBER', 'can_edit_org_settings')).toBe(false)
    })

    it('cannot manage species', () => {
      expect(hasCapability('MEMBER', 'can_manage_species')).toBe(false)
    })
  })

  describe('platform admin override', () => {
    it('grants all capabilities regardless of role', () => {
      for (const cap of CAPABILITIES) {
        expect(hasCapability('MEMBER', cap, true)).toBe(true)
        expect(hasCapability('MANAGER', cap, true)).toBe(true)
      }
    })
  })
})
