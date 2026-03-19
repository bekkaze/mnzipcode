import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geocode, reverse } from '../src/osm'

const mockSearchResponse = [
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

const mockReverseResponse = {
  lat: '47.9212',
  lon: '106.9057',
  display_name: 'Sukhbaatar, Ulaanbaatar, Mongolia',
  importance: 0.75,
  address: {
    suburb: 'Sukhbaatar',
    city: 'Ulaanbaatar',
    state: 'Ulaanbaatar',
    country: 'Mongolia',
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('geocode', () => {
  it('should return resolved result for valid query', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      }),
    )

    const result = await geocode('Ulaanbaatar', { cache: false })
    expect(result.resolved).toBe(true)
    expect(result.source).toBe('osm')
    expect(result.normalized?.city).toBe('Ulaanbaatar')
    expect(result.normalized?.country).toBe('Mongolia')
    expect(result.normalized?.lat).toBe(47.9212)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.candidates).toBeDefined()
    expect(result.candidates!.length).toBeGreaterThan(0)
  })

  it('should return unresolved for empty results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    )

    const result = await geocode('nonexistentplace12345', { cache: false })
    expect(result.resolved).toBe(false)
    expect(result.confidence).toBe(0)
  })

  it('should return unresolved for empty query', async () => {
    const result = await geocode('')
    expect(result.resolved).toBe(false)
  })

  it('should pass countryCode to request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    })
    vi.stubGlobal('fetch', mockFetch)

    await geocode('test', { countryCode: 'mn', cache: false })
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('countrycodes=mn')
  })

  it('should use custom endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    })
    vi.stubGlobal('fetch', mockFetch)

    await geocode('test', {
      endpoint: 'https://custom.nominatim.example.com',
      cache: false,
    })
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('custom.nominatim.example.com')
  })
})

describe('reverse', () => {
  it('should return resolved result for valid coordinates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReverseResponse),
      }),
    )

    const result = await reverse(47.9212, 106.9057, { cache: false })
    expect(result.resolved).toBe(true)
    expect(result.source).toBe('osm')
    expect(result.normalized?.city).toBe('Ulaanbaatar')
    expect(result.normalized?.district).toBe('Sukhbaatar')
    expect(result.input).toBe('47.9212,106.9057')
  })

  it('should return unresolved for error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'Unable to geocode' }),
      }),
    )

    const result = await reverse(0, 0, { cache: false })
    expect(result.resolved).toBe(false)
  })
})
