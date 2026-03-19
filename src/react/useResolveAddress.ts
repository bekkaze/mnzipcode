import { useState, useEffect, useRef } from 'react'
import { resolve } from '../resolver'
import type { ResolveResult, ResolveOptions } from '../core/types'

export interface UseResolveAddressResult {
  result: ResolveResult | null
  isLoading: boolean
  error: Error | null
}

/**
 * React hook for resolving addresses/zipcodes with debounce.
 *
 * @example
 * ```tsx
 * const { result, isLoading, error } = useResolveAddress('Баянзүрх', { mode: 'hybrid' })
 * ```
 */
export function useResolveAddress(
  input: string,
  options: ResolveOptions = {},
  debounceMs: number = 500,
): UseResolveAddressResult {
  const [result, setResult] = useState<ResolveResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController>()

  useEffect(() => {
    if (!input?.trim()) {
      setResult(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (abortRef.current) abortRef.current.abort()

    const controller = new AbortController()
    abortRef.current = controller

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await resolve(input, options)
        if (!controller.signal.aborted) {
          setResult(res)
          setIsLoading(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsLoading(false)
        }
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      controller.abort()
    }
  }, [input, options.mode, debounceMs])

  return { result, isLoading, error }
}
