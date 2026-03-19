import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolve } from '../src/resolver'

const mockOsmResponse = [
  {
    lat: '47.9212',
    lon: '106.9057',
    display_name: 'Ulaanbaatar, Mongolia',
    importance: 0.8,
    address: {
      city: 'Ulaanbaatar',
      state: 'Ulaanbaatar',
      country: 'Mongolia',
    },
  },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('resolve', () => {
  describe('local mode', () => {
    it('should resolve a zipcode', async () => {
      const result = await resolve('11000', { mode: 'local' })
      expect(result.resolved).toBe(true)
      expect(result.zipcode).toBe('11000')
      expect(result.source).toBe('local')
      expect(result.confidence).toBe(1.0)
    })

    it('should search by name', async () => {
      const result = await resolve('Дорнод', { mode: 'local' })
      expect(result.resolved).toBe(true)
      expect(result.source).toBe('local')
      expect(result.normalized?.aimag).toBeTruthy()
    })

    it('should return unresolved for no match', async () => {
      const result = await resolve('xyznonexistent', { mode: 'local' })
      expect(result.resolved).toBe(false)
      expect(result.source).toBe('local')
    })

    it('should include candidates', async () => {
      const result = await resolve('Баян', { mode: 'local' })
      expect(result.resolved).toBe(true)
      if (result.candidates) {
        expect(result.candidates.length).toBeGreaterThan(0)
        for (const c of result.candidates) {
          expect(c.source).toBe('local')
        }
      }
    })
  })

  describe('osm mode', () => {
    it('should use OSM for resolution', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockOsmResponse),
        }),
      )

      const result = await resolve('Ulaanbaatar', { mode: 'osm', osm: { cache: false } })
      expect(result.resolved).toBe(true)
      expect(result.source).toBe('osm')
    })
  })

  describe('hybrid mode', () => {
    it('should resolve zipcode locally without hitting OSM', async () => {
      const mockFetch = vi.fn()
      vi.stubGlobal('fetch', mockFetch)

      const result = await resolve('11000', { mode: 'hybrid' })
      expect(result.resolved).toBe(true)
      expect(result.source).toBe('local')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fall back to OSM when local search is weak', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockOsmResponse),
        }),
      )

      const result = await resolve('some random address in UB', {
        mode: 'hybrid',
        osm: { cache: false },
      })
      // Should have attempted OSM since local won't match well
      expect(result.source === 'osm' || result.source === 'hybrid').toBe(true)
    })

    it('should return best local result if OSM fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network error')),
      )

      const result = await resolve('Дорнод', { mode: 'hybrid', osm: { cache: false } })
      // Should still resolve locally since "Дорнод" matches
      expect(result.resolved).toBe(true)
      expect(result.source).toBe('local')
    })

    it('should return empty for no match anywhere', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        }),
      )

      const result = await resolve('zzznonexistent999', {
        mode: 'hybrid',
        osm: { cache: false },
      })
      expect(result.resolved).toBe(false)
    })
  })

  it('should handle empty input', async () => {
    const result = await resolve('')
    expect(result.resolved).toBe(false)
  })
})
