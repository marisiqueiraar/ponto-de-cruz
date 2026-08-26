import { db } from './db'
import type { CrossStitchFont } from '../../types/font'

export async function saveCustomFont(font: CrossStitchFont): Promise<void> {
  await db.fonts.put(font)
}

export async function listCustomFonts(): Promise<CrossStitchFont[]> {
  return db.fonts.toArray()
}

export async function deleteCustomFont(id: string): Promise<void> {
  await db.fonts.delete(id)
}
