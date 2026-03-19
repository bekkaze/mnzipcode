// Core (offline)
export { lookup, isValid, search, suggest, entryToResolveResult } from './core'
export { byZipcode, allEntries } from './core'

// Types
export type {
  ResolveResult,
  NormalizedAddress,
  Candidate,
  FlatEntry,
  SearchOptions,
  OsmOptions,
  ResolveOptions,
} from './core'

// OSM (optional)
export { geocode, reverse } from './osm'

// Resolver (hybrid)
export { resolve } from './resolver'
