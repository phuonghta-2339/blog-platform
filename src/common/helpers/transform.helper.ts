/**
 * Transform helpers for DTO field transformations
 * Centralized to avoid code duplication
 */

/**
 * Transform email to lowercase trimmed format
 * Returns undefined if value is not a string
 */
export function transformEmail(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

/**
 * Transform string to lowercase trimmed format
 * Returns undefined if value is not a string
 */
export function transformToLowerCase(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

/**
 * Transform string to trimmed format or null if empty
 * Returns null if value is not a string or is empty after trim
 */
export function transformToTrimmedOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
