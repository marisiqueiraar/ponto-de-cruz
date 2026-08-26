import { db } from './db'

export async function saveImage(id: string, blob: Blob): Promise<void> {
  await db.images.put({ id, blob })
}

export async function loadImage(id: string): Promise<Blob | undefined> {
  const record = await db.images.get(id)
  return record?.blob
}

export async function deleteImage(id: string): Promise<void> {
  await db.images.delete(id)
}
