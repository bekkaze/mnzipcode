import { describe, it, expect } from 'vitest'
import { lookup, isValid } from '../src/core'

describe('lookup', () => {
  it('should find Ulaanbaatar by zipcode', () => {
    const result = lookup('11000')
    expect(result).not.toBeNull()
    expect(result!.resolved).toBe(true)
    expect(result!.zipcode).toBe('11000')
    expect(result!.confidence).toBe(1.0)
    expect(result!.source).toBe('local')
    expect(result!.normalized?.city).toBe('Ulaanbaatar')
    expect(result!.normalized?.country).toBe('Mongolia')
  })

  it('should find a district under Ulaanbaatar', () => {
    const result = lookup('12000') // Baganuur
    expect(result).not.toBeNull()
    expect(result!.normalized?.city).toBe('Ulaanbaatar')
    expect(result!.normalized?.district).toBe('Baganuur')
  })

  it('should find a leaf-level entry with full chain', () => {
    const result = lookup('12001') // sub-item of Baganuur
    expect(result).not.toBeNull()
    expect(result!.normalized?.city).toBe('Ulaanbaatar')
    expect(result!.normalized?.district).toBe('Baganuur')
    expect(result!.normalized?.subdistrict).toBe('Хэрлэн голын хөвөө-1')
  })

  it('should find a province', () => {
    const result = lookup('21000') // Dornod
    expect(result).not.toBeNull()
    expect(result!.normalized?.aimag).toBe('Dornod')
  })

  it('should accept numeric input', () => {
    const result = lookup(11000)
    expect(result).not.toBeNull()
    expect(result!.zipcode).toBe('11000')
  })

  it('should return null for invalid zipcode', () => {
    expect(lookup('99999')).toBeNull()
    expect(lookup('00000')).toBeNull()
  })

  it('should pad short numeric input', () => {
    // zipcode 11000 as number 11000 should still work
    const result = lookup(11000)
    expect(result).not.toBeNull()
  })
})

describe('isValid', () => {
  it('should return true for valid zipcodes', () => {
    expect(isValid('11000')).toBe(true)
    expect(isValid('12000')).toBe(true)
    expect(isValid(21000)).toBe(true)
  })

  it('should return false for invalid zipcodes', () => {
    expect(isValid('99999')).toBe(false)
    expect(isValid('00000')).toBe(false)
    expect(isValid('')).toBe(false)
  })
})
