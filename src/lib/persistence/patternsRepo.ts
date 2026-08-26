import { db } from './db'
import type { Pattern } from '../../types/pattern'

export async function savePattern(pattern: Pattern): Promise<void> {
  await db.patterns.put(pattern)
}

export async function loadPattern(id: string): Promise<Pattern | undefined> {
  return db.patterns.get(id)
}

export async function deletePattern(id: string): Promise<void> {
  await db.patterns.delete(id)
}

export async function listPatterns(): Promise<Pattern[]> {
  return db.patterns.orderBy('updatedAt').reverse().toArray()
}
