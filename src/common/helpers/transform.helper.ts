/**
 * Transform helpers for DTO field transformations
 * Centralized to avoid code duplication
 */

/**
 * Transform email to lowercase trimmed format
 * Returns original value if not a string
 */
export function transformEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/**
 * Transform string to lowercase trimmed format
 * Returns original value if not a string
 */
export function transformToLowerCase(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/**
 * Transform string to trimmed format or null if empty
 * Returns original value if not a string
 * Returns null only if value is an empty string after trim
 */
export function transformToTrimmedOrNull(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed || null;
}
