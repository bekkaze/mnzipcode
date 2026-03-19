import { byZipcode } from './data'
import type { FlatEntry, ResolveResult, NormalizedAddress } from './types'

export type { FlatEntry, ResolveResult, NormalizedAddress, Candidate, SearchOptions, OsmOptions, ResolveOptions } from './types'
export { search, suggest } from './search'
export { byZipcode, allEntries } from './data'

/** Normalize a zipcode input to a 5-digit string */
function normalizeZipcode(input: string | number): string {
  return String(input).padStart(5, '0')
}

/** Build a NormalizedAddress by walking the parent chain */
function buildNormalized(entry: FlatEntry): NormalizedAddress {
  const result: NormalizedAddress = {
    country: 'Mongolia',
  }

  // Walk up the chain to gather context
  const chain: FlatEntry[] = []
  let current: FlatEntry | undefined = entry
  while (current) {
    chain.unshift(current)
    current = current.parentZipcode
      ? byZipcode.get(current.parentZipcode)
      : undefined
  }

  // chain[0] = root (capital/province), chain[1] = district/soum, chain[2] = sub-area
  for (const node of chain) {
    if (node.stat === 'capital') {
      result.city = node.name || node.mnname
    } else if (node.stat === 'province') {
      result.aimag = node.name || node.mnname
    } else if (node.stat === 'district') {
      result.district = node.name || node.mnname
    } else if (node.level === 1) {
      // Soum (province sub-item without stat=district)
      result.soum = node.mnname
    } else if (node.level === 2) {
      // Sub-area / khoroo / bag
      result.subdistrict = node.mnname
    }
  }

  return result
}

/** Convert a FlatEntry to a ResolveResult */
export function entryToResolveResult(
  entry: FlatEntry,
  input: string,
  confidence: number = 1.0,
): ResolveResult {
  return {
    input,
    resolved: true,
    zipcode: entry.zipcode,
    confidence,
    source: 'local',
    normalized: buildNormalized(entry),
  }
}

/**
 * Look up an exact zipcode. Returns a ResolveResult or null.
 *
 * @example
 * ```ts
 * lookup('11000') // Ulaanbaatar
 * lookup(12001)   // also works with numbers
 * ```
 */
export function lookup(zipcode: string | number): ResolveResult | null {
  const normalized = normalizeZipcode(zipcode)
  const entry = byZipcode.get(normalized)
  if (!entry) return null
  return entryToResolveResult(entry, normalized)
}

/**
 * Check if a zipcode exists in the dataset.
 *
 * @example
 * ```ts
 * isValid('11000') // true
 * isValid('99999') // false
 * ```
 */
export function isValid(zipcode: string | number): boolean {
  return byZipcode.has(normalizeZipcode(zipcode))
}
