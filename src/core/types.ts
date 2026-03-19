/** Normalized address structure returned by all APIs */
export interface NormalizedAddress {
  country?: string
  city?: string
  district?: string
  subdistrict?: string
  khoroo?: string
  aimag?: string
  soum?: string
  lat?: number
  lon?: number
  rawAddress?: string
}

/** A single candidate in a resolve result */
export interface Candidate {
  name: string
  zipcode?: string
  source: 'local' | 'osm'
  confidence: number
}

/** Unified output for all resolve/lookup/search operations */
export interface ResolveResult {
  input: string
  resolved: boolean
  zipcode?: string
  confidence: number
  source: 'local' | 'osm' | 'hybrid'
  normalized?: NormalizedAddress
  candidates?: Candidate[]
}

/** Flattened entry from the hierarchical dataset */
export interface FlatEntry {
  zipcode: string
  mnname: string
  name?: string
  stat?: 'capital' | 'province' | 'district'
  level: 0 | 1 | 2
  parentZipcode?: string
  rootZipcode: string
  area?: number
  population?: number
  density?: number
}

/** Options for search and suggest */
export interface SearchOptions {
  limit?: number
}

/** Options for OSM API calls */
export interface OsmOptions {
  endpoint?: string
  userAgent?: string
  cache?: boolean
  cacheTTL?: number
  countryCode?: string
}

/** Options for the hybrid resolve function */
export interface ResolveOptions {
  mode?: 'local' | 'osm' | 'hybrid'
  osm?: OsmOptions
  fuzzyThreshold?: number
}
