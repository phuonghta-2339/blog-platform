import { RequestMethod } from '@nestjs/common';
import { RouteInfo } from '@nestjs/common/interfaces';
import { BULL_BOARD_CONFIG } from '@modules/mail/constants/mail-queue.constants';

/**
 * Global API prefix exclusion paths
 * These routes will NOT have the global prefix (e.g., /api) prepended.
 * Use RouteInfo objects for precise control over methods and path patterns.
 */
export const GLOBAL_PREFIX_EXCLUDE: (string | RouteInfo)[] = [
  // Root path
  { path: '/', method: RequestMethod.GET },

  // Health check endpoint
  { path: 'health', method: RequestMethod.GET },

  // BullBoard Queue Dashboard
  // Needs to bypass prefix for correct static asset loading and UI routing
  { path: BULL_BOARD_CONFIG.EXCLUDE_PATTERN, method: RequestMethod.ALL },
];
