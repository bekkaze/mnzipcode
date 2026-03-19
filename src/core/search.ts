import { allEntries, byZipcode } from './data'
import type { FlatEntry, ResolveResult, Candidate, SearchOptions } from './types'
import { entryToResolveResult } from './index'

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

interface ScoredEntry {
  entry: FlatEntry
  score: number
}

function scoreEntry(entry: FlatEntry, queryLower: string): number {
  const mnLower = entry.mnname.toLowerCase()
  const nameLower = entry.name?.toLowerCase() ?? ''

  // Exact match
  if (mnLower === queryLower || nameLower === queryLower) return 1.0

  // Starts with
  if (mnLower.startsWith(queryLower) || nameLower.startsWith(queryLower)) return 0.9

  // Contains
  if (mnLower.includes(queryLower) || nameLower.includes(queryLower)) return 0.7

  // Fuzzy (only for short queries to avoid noise)
  if (queryLower.length <= 15) {
    const minLen = Math.min(mnLower.length, queryLower.length)
    const maxLen = Math.max(mnLower.length, queryLower.length)
    if (maxLen > 0) {
      const dist = Math.min(
        levenshtein(mnLower, queryLower),
        nameLower ? levenshtein(nameLower, queryLower) : Infinity,
      )
      const threshold = Math.max(2, Math.floor(minLen * 0.4))
      if (dist <= threshold) {
        return Math.max(0.1, 0.5 - dist / maxLen)
      }
    }
  }

  return 0
}

/**
 * Search entries by text query with fuzzy matching.
 * Searches across both Cyrillic (mnname) and Latin (name) fields.
 */
export function search(
  query: string,
  options: SearchOptions = {},
): ResolveResult[] {
  const { limit = 10 } = options
  if (!query || !query.trim()) return []

  const queryLower = query.trim().toLowerCase()
  const scored: ScoredEntry[] = []

  for (const entry of allEntries) {
    const score = scoreEntry(entry, queryLower)
    if (score > 0) {
      scored.push({ entry, score })
    }
  }

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(({ entry, score }) =>
    entryToResolveResult(entry, query, score),
  )
}

/**
 * Autocomplete-style suggestions. Prefix-biased, lightweight.
 */
export function suggest(
  query: string,
  options: SearchOptions = {},
): Candidate[] {
  const { limit = 5 } = options
  if (!query || !query.trim()) return []

  const queryLower = query.trim().toLowerCase()
  const results: Array<{ candidate: Candidate; score: number }> = []

  for (const entry of allEntries) {
    const mnLower = entry.mnname.toLowerCase()
    const nameLower = entry.name?.toLowerCase() ?? ''

    let score = 0
    if (mnLower.startsWith(queryLower) || nameLower.startsWith(queryLower)) {
      score = 0.9
    } else if (mnLower.includes(queryLower) || nameLower.includes(queryLower)) {
      score = 0.6
    }

    if (score > 0) {
      results.push({
        candidate: {
          name: entry.name || entry.mnname,
          zipcode: entry.zipcode,
          source: 'local',
          confidence: score,
        },
        score,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit).map((r) => r.candidate)
}
