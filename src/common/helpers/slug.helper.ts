/**
 * Slug Generation Helper
 * Provides utility functions for creating URL-friendly slugs
 */

/**
 * Generate URL-friendly slug from text
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 * @param text - Text to slugify
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize Unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, ''); // Remove trailing hyphens
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
