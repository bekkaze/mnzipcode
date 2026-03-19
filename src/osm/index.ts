import type { ResolveResult, OsmOptions } from '../core/types'
import { createNominatimClient } from './nominatim'
import { createCache } from './cache'

const DEFAULT_ENDPOINT = 'https://nominatim.openstreetmap.org'
const DEFAULT_USER_AGENT = 'mnzipcode/2.0'
const DEFAULT_CACHE_TTL = 3600000 // 1 hour

const globalCache = createCache<ResolveResult>()

function getClient(options?: OsmOptions) {
  return createNominatimClient({
    endpoint: options?.endpoint ?? DEFAULT_ENDPOINT,
    userAgent: options?.userAgent ?? DEFAULT_USER_AGENT,
  })
}

function cacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

/**
 * Forward geocode a query string using Nominatim.
 * Returns normalized ResolveResult with source "osm".
 */
export async function geocode(
  query: string,
  options?: OsmOptions,
): Promise<ResolveResult> {
  if (!query?.trim()) {
    return { input: query ?? '', resolved: false, confidence: 0, source: 'osm' }
  }

  const key = cacheKey('geocode', query.trim())
  const useCache = options?.cache !== false
  const ttl = options?.cacheTTL ?? DEFAULT_CACHE_TTL

  if (useCache) {
    const cached = globalCache.get(key)
    if (cached) return cached
  }

  const client = getClient(options)
  const countryCode = options?.countryCode ?? 'mn'

  const data = await client.search(query.trim(), countryCode)

  if (!data || data.length === 0) {
    const result: ResolveResult = {
      input: query,
      resolved: false,
      confidence: 0,
      source: 'osm',
    }
    return result
  }

  const top = data[0]
  const result: ResolveResult = {
    input: query,
    resolved: true,
    confidence: Math.min(1, Number(top.importance ?? 0.5)),
    source: 'osm',
    normalized: {
      country: top.address?.country,
      city: top.address?.city || top.address?.town || top.address?.village,
      district: top.address?.suburb || top.address?.city_district,
      aimag: top.address?.state,
      rawAddress: top.display_name,
      lat: Number(top.lat),
      lon: Number(top.lon),
    },
    candidates: data.slice(0, 5).map((item: any) => ({
      name: item.display_name,
      source: 'osm' as const,
      confidence: Math.min(1, Number(item.importance ?? 0.5)),
    })),
  }

  if (useCache) {
    globalCache.set(key, result, ttl)
  }

  return result
}

/**
 * Reverse geocode coordinates using Nominatim.
 * Returns normalized ResolveResult with source "osm".
 */
export async function reverse(
  lat: number,
  lon: number,
  options?: OsmOptions,
): Promise<ResolveResult> {
  const key = cacheKey('reverse', lat, lon)
  const useCache = options?.cache !== false
  const ttl = options?.cacheTTL ?? DEFAULT_CACHE_TTL

  if (useCache) {
    const cached = globalCache.get(key)
    if (cached) return cached
  }

  const client = getClient(options)
  const data = await client.reverse(lat, lon)

  if (!data || data.error) {
    return {
      input: `${lat},${lon}`,
      resolved: false,
      confidence: 0,
      source: 'osm',
    }
  }

  const result: ResolveResult = {
    input: `${lat},${lon}`,
    resolved: true,
    confidence: Math.min(1, Number(data.importance ?? 0.5)),
    source: 'osm',
    normalized: {
      country: data.address?.country,
      city: data.address?.city || data.address?.town || data.address?.village,
      district: data.address?.suburb || data.address?.city_district,
      aimag: data.address?.state,
      rawAddress: data.display_name,
      lat: Number(data.lat),
      lon: Number(data.lon),
    },
  }

  if (useCache) {
    globalCache.set(key, result, ttl)
  }

  return result
}
