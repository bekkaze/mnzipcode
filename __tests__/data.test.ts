import { describe, it, expect } from 'vitest'
import { byZipcode, allEntries } from '../src/core/data'

describe('data layer', () => {
  it('should load all entries', () => {
    expect(allEntries.length).toBeGreaterThan(2500)
  })

  it('should index all unique zipcodes', () => {
    // data.json has a few duplicate zipcodes (same zipcode, different names)
    // the Map keeps the last one, allEntries keeps all
    expect(byZipcode.size).toBeGreaterThan(2500)
    expect(allEntries.length).toBeGreaterThanOrEqual(byZipcode.size)
  })

  it('should have required fields on every entry', () => {
    for (const entry of allEntries) {
      expect(entry.zipcode).toBeTruthy()
      expect(entry.mnname).toBeTruthy()
      expect(entry.rootZipcode).toBeTruthy()
      expect([0, 1, 2]).toContain(entry.level)
    }
  })

  it('should index by zipcode correctly', () => {
    const ub = byZipcode.get('11000')
    expect(ub).toBeDefined()
    expect(ub!.mnname).toBe('Улаанбаатар')
    expect(ub!.name).toBe('Ulaanbaatar')
    expect(ub!.stat).toBe('capital')
    expect(ub!.level).toBe(0)
  })

  it('should set parent chain correctly', () => {
    // Baganuur district is under Ulaanbaatar
    const baganuur = byZipcode.get('12000')
    expect(baganuur).toBeDefined()
    expect(baganuur!.parentZipcode).toBe('11000')
    expect(baganuur!.rootZipcode).toBe('11000')
    expect(baganuur!.level).toBe(1)

    // A sub-item of Baganuur
    const sub = byZipcode.get('12001')
    expect(sub).toBeDefined()
    expect(sub!.parentZipcode).toBe('12000')
    expect(sub!.rootZipcode).toBe('11000')
    expect(sub!.level).toBe(2)
  })

  it('should have 22 top-level entries', () => {
    const topLevel = allEntries.filter((e) => e.level === 0)
    expect(topLevel).toHaveLength(22)
  })
})
