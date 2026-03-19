import { useState, useEffect, useRef } from 'react'
import { search } from '../core'
import type { ResolveResult, SearchOptions } from '../core/types'

export interface UseZipcodeSearchOptions extends SearchOptions {
  debounceMs?: number
}

export interface UseZipcodeSearchResult {
  results: ResolveResult[]
  isSearching: boolean
}

/**
 * React hook for debounced zipcode/location search.
 *
 * @example
 * ```tsx
 * const { results, isSearching } = useZipcodeSearch('Баян', { debounceMs: 300 })
 * ```
 */
export function useZipcodeSearch(
  query: string,
  options: UseZipcodeSearchOptions = {},
): UseZipcodeSearchResult {
  const { debounceMs = 300, limit } = options
  const [results, setResults] = useState<ResolveResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!query?.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      const searchResults = search(query, { limit })
      setResults(searchResults)
      setIsSearching(false)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query, debounceMs, limit])

  return { results, isSearching }
}
