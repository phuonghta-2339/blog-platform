/**
 * Slug Generation Helper
 * Provides utility functions for creating URL-friendly slugs
 */

/**
 * Generate URL-friendly slug from text
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 * @param text - Text to slugify
 * @returns URL-friendly slug
 * @throws Error if text is empty, whitespace-only, or produces an empty slug after processing
 */
export function slugify(text: string): string {
  // Validate input is not empty or whitespace-only
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Slug input cannot be empty or whitespace-only');
  }

  const slug = text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize Unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, ''); // Remove trailing hyphens

  // Validate result is not empty (handles cases like "🎉🎊" or "!!!@@@")
  if (!slug) {
    throw new Error(
      `Invalid slug input: "${text}" contains only special characters or emojis and cannot be converted to a valid slug`,
    );
  }

  return slug;
}

/**
 * Generate unique slug with timestamp suffix
 * @param baseSlug - Base slug without suffix
 * @param counter - Optional counter for multiple collisions
 * @param maxLength - Maximum total slug length
 * @returns Slug with timestamp suffix, truncated if necessary
 */
export function generateUniqueSlug(
  baseSlug: string,
  counter = 0,
  maxLength = 255,
): string {
  const timestamp = Date.now();
  const suffix = counter > 0 ? `${timestamp}-${counter}` : `${timestamp}`;
  const fullSlug = `${baseSlug}-${suffix}`;

  // If slug exceeds maxLength, truncate baseSlug
  if (fullSlug.length > maxLength) {
    const suffixLength = suffix.length + 1; // +1 for dash
    const maxBaseLength = maxLength - suffixLength;
    const truncatedBase = baseSlug.substring(0, maxBaseLength);
    return `${truncatedBase}-${suffix}`;
  }

  return fullSlug;
}
