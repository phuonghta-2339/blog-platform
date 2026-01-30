/**
 * Event Names
 * Centralized event names used with EventEmitter2
 */
export const Events = {
  USER_REGISTERED: 'user.registered',
  USER_FOLLOWED: 'user.followed',
} as const;

export type EventType = (typeof Events)[keyof typeof Events];
