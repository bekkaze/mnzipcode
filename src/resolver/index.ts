import { lookup, search, entryToResolveResult } from '../core'
import { geocode } from '../osm'
import { allEntries } from '../core/data'
import type { ResolveResult, ResolveOptions } from '../core/types'

function looksLikeZipcode(input: string): boolean {
  return /^\d{3,5}$/.test(input.trim())
}

/**
 * Try to find a local zipcode match for an OSM result by matching
 * the address components against local entry names.
 */
function crossReferenceLocal(osmResult: ResolveResult): string | undefined {
  if (!osmResult.normalized) return undefined

  const parts = [
    osmResult.normalized.district,
    osmResult.normalized.city,
    osmResult.normalized.aimag,
  ].filter(Boolean)

  for (const part of parts) {
    if (!part) continue
    const lower = part.toLowerCase()
    for (const entry of allEntries) {
      const mn = entry.mnname.toLowerCase()
      const name = entry.name?.toLowerCase() ?? ''
      if (mn === lower || name === lower || mn.includes(lower) || name.includes(lower)) {
        return entry.zipcode
      }
    }
  }

  return undefined
}

/**
 * Resolve an input to a zipcode and normalized address.
 *
 * Supports three modes:
 * - `local`: offline only, uses dataset
 * - `osm`: online only, uses Nominatim
 * - `hybrid` (default): tries local first, falls back to OSM
 *
 * @example
 * ```ts
 * // Hybrid mode (default)
 * const result = await resolve('Баянзүрх')
 *
 * // Local only
 * const result = await resolve('11000', { mode: 'local' })
 *
 * // OSM only
 * const result = await resolve('Ulaanbaatar', { mode: 'osm' })
 * ```
 */
export async function resolve(
  input: string,
  options: ResolveOptions = {},
): Promise<ResolveResult> {
  const { mode = 'hybrid', fuzzyThreshold = 0.6 } = options
  const trimmed = input?.trim() ?? ''

  if (!trimmed) {
    return { input: trimmed, resolved: false, confidence: 0, source: mode === 'osm' ? 'osm' : 'local' }
  }

  // --- Local mode ---
  if (mode === 'local') {
    if (looksLikeZipcode(trimmed)) {
      const result = lookup(trimmed)
      if (result) return result
    }
    const results = search(trimmed, { limit: 5 })
    if (results.length > 0 && results[0].confidence >= fuzzyThreshold) {
      return {
        ...results[0],
        candidates: results.slice(1).map((r) => ({
          name: r.normalized?.subdistrict || r.normalized?.district || r.normalized?.soum || r.normalized?.aimag || '',
          zipcode: r.zipcode,
          source: 'local' as const,
          confidence: r.confidence,
        })),
      }
    }
    return { input: trimmed, resolved: false, confidence: 0, source: 'local' }
  }

  // --- OSM mode ---
  if (mode === 'osm') {
    return geocode(trimmed, options.osm)
  }

  // --- Hybrid mode ---
  // Step 1: Try exact zipcode lookup
  if (looksLikeZipcode(trimmed)) {
    const result = lookup(trimmed)
    if (result) return result
  }

  // Step 2: Try local search
  const localResults = search(trimmed, { limit: 5 })
  if (localResults.length > 0 && localResults[0].confidence >= fuzzyThreshold) {
    return {
      ...localResults[0],
      candidates: localResults.slice(1).map((r) => ({
        name: r.normalized?.subdistrict || r.normalized?.district || r.normalized?.soum || r.normalized?.aimag || '',
        zipcode: r.zipcode,
        source: 'local' as const,
        confidence: r.confidence,
      })),
    }
  }

  // Step 3: Fall back to OSM
  try {
    const osmResult = await geocode(trimmed, options.osm)
    if (osmResult.resolved) {
      // Step 4: Cross-reference OSM result with local data
      const localZipcode = crossReferenceLocal(osmResult)
      if (localZipcode) {
        return {
          ...osmResult,
          zipcode: localZipcode,
          source: 'hybrid',
          confidence: osmResult.confidence * 0.9,
        }
      }
      return osmResult
    }
  } catch {
    // OSM failed — return best local result if any
    if (localResults.length > 0) {
      return localResults[0]
    }
  }

  return { input: trimmed, resolved: false, confidence: 0, source: 'hybrid' }
}
