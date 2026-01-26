import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.interface';

/**
 * Request interface with authenticated user
 *
 * This interface extends the Express Request type to include the user
 * property that is attached by JWT authentication strategies after
 * successful authentication.
 *
 * @see {@link AuthenticatedUser} for the user object structure
 */
export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
