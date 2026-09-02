/**
 * Project names are not decorative: they become the PDF heading, the per-page
 * running title and the downloaded filename. So they can never be blank, and
 * they have to survive a trip through `doc.save()`.
 */

export const DEFAULT_PATTERN_NAME = 'Sem título'
export const DEFAULT_MAT_NAME = 'Nova moldura'

/** Long enough for "Aniversário da Helena — 2 anos", short enough to fit the PDF heading. */
const MAX_LENGTH = 60

/** Trims, collapses runs of whitespace and falls back when the user clears the field. */
export function normalizeProjectName(input: string, fallback: string): string {
  const collapsed = input.replace(/\s+/g, ' ').trim()
  if (!collapsed) return fallback
  return collapsed.slice(0, MAX_LENGTH).trim()
}

/**
 * Turns a project name into a safe download filename. Slashes, colons and the
 * other characters below break the save dialog on at least one major platform,
 * so they collapse into hyphens rather than being dropped.
 */
export function toFileName(name: string, fallback: string): string {
  const safe = name
    .replace(/[/\\:*?"<>|\s]+/g, '-')
    .replace(/-{2,}/g, '-')
    // Windows rejects names that end in a dot or a space.
    .replace(/^[-.]+|[-.]+$/g, '')
  return safe || fallback
}
