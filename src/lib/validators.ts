/**
 * Strict UUID v4 validation.
 * Returns true only for valid UUID v4 strings.
 * Rejects 'undefined', 'null', empty strings, and malformed UUIDs.
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value === 'undefined' || value === 'null' || value.trim() === '') return false
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return UUID_V4_REGEX.test(value)
}