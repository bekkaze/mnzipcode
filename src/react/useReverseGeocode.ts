import { useState, useEffect, useRef } from 'react'
import { reverse } from '../osm'
import type { ResolveResult, OsmOptions } from '../core/types'

export interface UseReverseGeocodeResult {
  result: ResolveResult | null
  isLoading: boolean
  error: Error | null
}

/**
 * React hook for reverse geocoding map coordinates to addresses.
 * Triggers when lat/lon change (both must be non-null).
 *
 * Designed for: map click → get lat/lon → pass here → get zipcode + address
 *
 * @example
 * ```tsx
 * function MapComponent() {
 *   const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
 *   const { result, isLoading } = useReverseGeocode(coords?.lat ?? null, coords?.lon ?? null)
 *
 *   // On map click: setCoords({ lat, lon })
 *   // result will contain the resolved address + zipcode
 * }
 * ```
 */
export function useReverseGeocode(
  lat: number | null,
  lon: number | null,
  options?: OsmOptions,
): UseReverseGeocodeResult {
  const [result, setResult] = useState<ResolveResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController>()

  useEffect(() => {
    if (lat === null || lon === null) {
      setResult(null)
      setIsLoading(false)
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    reverse(lat, lon, options)
      .then((res) => {
        if (!controller.signal.aborted) {
          setResult(res)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [lat, lon])

  return { result, isLoading, error }
}
