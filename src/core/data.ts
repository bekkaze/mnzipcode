import rawData from '../../data/data.json'
import type { FlatEntry } from './types'

interface RawItem {
  zipcode: string
  mnname: string
  name?: string
  stat?: string
  area?: number
  population?: number
  density?: number
  sub_items?: RawItem[]
  [key: string]: unknown
}

const byZipcode = new Map<string, FlatEntry>()
const allEntries: FlatEntry[] = []

function flatten(
  items: RawItem[],
  level: 0 | 1 | 2,
  parentZip?: string,
  rootZip?: string,
): void {
  for (const item of items) {
    const entry: FlatEntry = {
      zipcode: item.zipcode,
      mnname: item.mnname,
      name: item.name,
      stat: item.stat as FlatEntry['stat'],
      level,
      parentZipcode: parentZip,
      rootZipcode: rootZip ?? item.zipcode,
      area: item.area,
      population: item.population,
      density: item.density,
    }
    byZipcode.set(entry.zipcode, entry)
    allEntries.push(entry)

    if (item.sub_items && level < 2) {
      flatten(
        item.sub_items,
        (level + 1) as 1 | 2,
        item.zipcode,
        rootZip ?? item.zipcode,
      )
    }
  }
}

flatten((rawData as { zipcode: RawItem[] }).zipcode, 0)

export { byZipcode, allEntries }
