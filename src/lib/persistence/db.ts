import Dexie, { type EntityTable } from 'dexie'
import type { Pattern } from '../../types/pattern'
import type { CrossStitchFont } from '../../types/font'

interface StoredImage {
  id: string
  blob: Blob
}

interface StoredSetting {
  key: string
  value: unknown
}

// IndexedDB's structured clone algorithm supports Uint16Array and nested objects natively,
// so a Pattern (including baseCells) can be stored as-is.
const db = new Dexie('cross-stitch') as Dexie & {
  patterns: EntityTable<Pattern, 'id'>
  images: EntityTable<StoredImage, 'id'>
  settings: EntityTable<StoredSetting, 'key'>
  fonts: EntityTable<CrossStitchFont, 'id'>
}

db.version(1).stores({
  patterns: 'id, name, updatedAt',
  images: 'id',
  settings: 'key',
})

db.version(2).stores({
  fonts: 'id, name',
})

export type { StoredImage, StoredSetting }
export { db }
