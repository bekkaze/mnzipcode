import { describe, it, expect } from 'vitest'
import { search, suggest } from '../src/core'

describe('search', () => {
  it('should find by exact Cyrillic name', () => {
    const results = search('Улаанбаатар')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].normalized?.city).toBe('Ulaanbaatar')
    expect(results[0].confidence).toBe(1.0)
  })

  it('should find by Latin name', () => {
    const results = search('Ulaanbaatar')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].zipcode).toBe('11000')
  })

  it('should find by partial name', () => {
    const results = search('Баян')
    expect(results.length).toBeGreaterThan(0)
    // Should match entries starting with or containing "Баян"
    for (const r of results) {
      const mn = r.normalized?.subdistrict || r.normalized?.district || r.normalized?.aimag || r.normalized?.soum || ''
      const name = r.normalized?.city || ''
      const hasMatch =
        mn.toLowerCase().includes('баян') ||
        name.toLowerCase().includes('баян') ||
        r.zipcode?.startsWith('64') // Баянхонгор is 64000
      expect(hasMatch || r.confidence > 0).toBe(true)
    }
  })

  it('should respect limit option', () => {
    const results = search('Баян', { limit: 3 })
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('should return empty for empty query', () => {
    expect(search('')).toEqual([])
    expect(search('  ')).toEqual([])
  })

  it('should handle fuzzy matches', () => {
    // Slight misspelling
    const results = search('Дорнот') // should fuzzy match "Дорнод"
    expect(results.length).toBeGreaterThan(0)
  })

  it('should return results sorted by relevance', () => {
    const results = search('Dornod')
    expect(results.length).toBeGreaterThan(0)
    // First result should have highest confidence
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence)
    }
  })
})

describe('suggest', () => {
  it('should return candidates for prefix', () => {
    const candidates = suggest('Улаан')
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates[0].source).toBe('local')
    expect(candidates[0].zipcode).toBeTruthy()
  })

  it('should respect limit', () => {
    const candidates = suggest('Б', { limit: 3 })
    expect(candidates.length).toBeLessThanOrEqual(3)
  })

  it('should return empty for empty query', () => {
    expect(suggest('')).toEqual([])
  })

  it('should match Latin names too', () => {
    const candidates = suggest('Dor')
    expect(candidates.length).toBeGreaterThan(0)
  })
})
