/**
 * Username validation pattern
 * - Allows only alphanumeric characters and underscores
 * - Used for username field validation
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Password strength validation pattern
 * - At least 1 lowercase letter (a-z)
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 digit (0-9)
 * - Used for password field validation
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
