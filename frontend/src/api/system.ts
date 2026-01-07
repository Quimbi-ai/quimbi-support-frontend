import { apiClient } from '../lib/api-client';
import type { SystemConfiguration } from '../types';

/**
 * System configuration API
 *
 * NOTE: This endpoint needs to be implemented on the backend.
 * See BACKEND_TODO.md for specification.
 */
export const systemApi = {
  // Get system configuration including behavioral axes
  getConfiguration: async (): Promise<SystemConfiguration> => {
    return apiClient.get<SystemConfiguration>('/api/system/configuration');
  },
};
