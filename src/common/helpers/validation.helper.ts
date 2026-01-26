/**
 * Validation helpers for common validation patterns
 * Centralized to ensure consistency and maintainability
 */

/**
 * Validates that at least one field from a list of required fields is defined in an object
 * Useful for update operations where at least one field must be provided
 *
 * @param obj - Object to validate
 * @param requiredFields - Array of field names that must have at least one defined
 * @returns true if at least one field is defined, false otherwise
 */
export function hasAtLeastOneField<T extends object>(
  obj: T,
  requiredFields: readonly (keyof T)[],
): boolean {
  return requiredFields.some((field) => obj[field] !== undefined);
}

/**
 * Get list of defined fields from an object
 * Useful for logging or error messages
 *
 * @param obj - Object to check
 * @param fields - Array of field names to check
 * @returns Array of field names that are defined
 */
export function getDefinedFields<T extends object>(
  obj: T,
  fields: readonly (keyof T)[],
): (keyof T)[] {
  return fields.filter((field) => obj[field] !== undefined);
}

/**
 * Get list of undefined fields from an object
 * Useful for validation error messages
 *
 * @param obj - Object to check
 * @param fields - Array of field names to check
 * @returns Array of field names that are undefined
 */
export function getUndefinedFields<T extends object>(
  obj: T,
  fields: readonly (keyof T)[],
): (keyof T)[] {
  return fields.filter((field) => obj[field] === undefined);
}
