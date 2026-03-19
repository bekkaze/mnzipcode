import React, { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { ResolveResult } from '../core/types'
import { useReverseGeocode } from '../react/useReverseGeocode'

const MARKER_ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
const MARKER_ICON_2X_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'
const MARKER_SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'

export interface ZipcodeMapProps {
  /** Map center [lat, lon]. Default: Mongolia center */
  center?: [number, number]
  /** Initial zoom level. Default: 6 */
  zoom?: number
  /** Map height. Default: '400px' */
  height?: string | number
  /** Map width. Default: '100%' */
  width?: string | number
  /** CSS class for the outer wrapper div */
  className?: string
  /** Inline style for the outer wrapper div */
  style?: React.CSSProperties
  /** CSS class applied directly to the MapContainer */
  mapClassName?: string
  /** Inline style applied directly to the MapContainer */
  mapStyle?: React.CSSProperties
  /** Custom tile URL. Default: OSM */
  tileUrl?: string
  /** Tile attribution */
  tileAttribution?: string
  /** Called when a location is resolved after clicking */
  onResolve?: (result: ResolveResult, coords: { lat: number; lon: number }) => void
  /** Called immediately on map click with raw coords */
  onClick?: (coords: { lat: number; lon: number }) => void
  /** Custom popup render. Return null to hide popup */
  renderPopup?: (result: ResolveResult | null, isLoading: boolean, coords: { lat: number; lon: number }) => React.ReactNode
  /** Custom Leaflet marker icon. If not provided, uses CDN-hosted default icon */
  markerIcon?: L.Icon
  /** Disable click-to-resolve. Default: false */
  disabled?: boolean
}

// Create a safe default icon that doesn't rely on L.Icon.Default (which breaks in bundlers)
const defaultIcon = new L.Icon({
  iconUrl: MARKER_ICON_URL,
  iconRetinaUrl: MARKER_ICON_2X_URL,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function ClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function defaultPopupContent(
  result: ResolveResult | null,
  isLoading: boolean,
  coords: { lat: number; lon: number },
): React.ReactNode {
  if (isLoading) {
    return <span>Resolving...</span>
  }
  if (!result) {
    return (
      <span>
        {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
      </span>
    )
  }
  if (!result.resolved) {
    return <span>No result found</span>
  }

  const parts: string[] = []
  const n = result.normalized
  if (n?.subdistrict) parts.push(n.subdistrict)
  if (n?.district) parts.push(n.district)
  if (n?.city) parts.push(n.city)
  if (n?.aimag) parts.push(n.aimag)
  if (n?.soum) parts.push(n.soum)

  return (
    <div>
      {result.zipcode && (
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{result.zipcode}</div>
      )}
      {parts.length > 0 && <div>{parts.join(', ')}</div>}
      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
        {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} · {result.source} ·{' '}
        {(result.confidence * 100).toFixed(0)}%
      </div>
    </div>
  )
}

/**
 * Interactive map component for zipcode discovery.
 * Click anywhere on the map to reverse geocode and get the zipcode.
 *
 * Requires `leaflet` and `react-leaflet` as peer dependencies.
 * You must import Leaflet CSS yourself: `import 'leaflet/dist/leaflet.css'`
 *
 * @example
 * ```tsx
 * import { ZipcodeMap } from 'mnzipcode/map'
 * import 'leaflet/dist/leaflet.css'
 *
 * <ZipcodeMap
 *   height={500}
 *   onResolve={(result) => console.log(result.zipcode)}
 * />
 * ```
 */
export function ZipcodeMap({
  center = [47.92, 106.91],
  zoom = 6,
  height = '400px',
  width = '100%',
  className,
  style,
  mapClassName,
  mapStyle,
  tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  onResolve,
  onClick,
  renderPopup,
  markerIcon,
  disabled = false,
}: ZipcodeMapProps) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const { result, isLoading } = useReverseGeocode(
    coords?.lat ?? null,
    coords?.lon ?? null,
  )

  // Notify parent when resolved
  const lastNotified = React.useRef<string>('')
  React.useEffect(() => {
    if (result && coords && onResolve) {
      const key = `${coords.lat},${coords.lon}`
      if (key !== lastNotified.current) {
        lastNotified.current = key
        onResolve(result, coords)
      }
    }
  }, [result, coords, onResolve])

  const handleClick = useCallback(
    (lat: number, lon: number) => {
      if (disabled) return
      setCoords({ lat, lon })
      onClick?.({ lat, lon })
    },
    [disabled, onClick],
  )

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height
  const resolvedWidth = typeof width === 'number' ? `${width}px` : width

  const popupContent = coords
    ? renderPopup
      ? renderPopup(result, isLoading, coords)
      : defaultPopupContent(result, isLoading, coords)
    : null

  return (
    <div
      className={className}
      style={{
        width: resolvedWidth,
        borderRadius: 8,
        overflow: 'hidden',
        ...style,
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className={mapClassName}
        style={{ height: resolvedHeight, width: '100%', ...mapStyle }}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        <ClickHandler onClick={handleClick} />
        {coords && (
          <Marker
            position={[coords.lat, coords.lon]}
            icon={markerIcon || defaultIcon}
          >
            {popupContent !== null && <Popup>{popupContent}</Popup>}
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
