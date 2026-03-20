/**
 * Normalizes a name for deduplication:
 * - Trims leading/trailing whitespace
 * - Collapses internal multiple spaces to single space
 * - Converts to lowercase
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}
