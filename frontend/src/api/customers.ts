import { apiClient } from '../lib/api-client';
import type { CustomerProfile, Order } from '../types';

export const customerApi = {
  // Get random customer (for testing)
  getRandom: async (): Promise<CustomerProfile> => {
    return apiClient.get<CustomerProfile>('/api/mcp/customer/random');
  },

  // Get specific customer profile
  getById: async (customerId: string): Promise<CustomerProfile> => {
    return apiClient.get<CustomerProfile>(`/api/mcp/customer/${customerId}`);
  },

  // Get customer churn risk
  getChurnRisk: async (customerId: string) => {
    return apiClient.get(`/api/mcp/customer/${customerId}/churn-risk`);
  },

  // Get customer order history
  getOrders: async (
    customerId: string,
    params?: {
      search_terms?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{ customer_id: string; orders: Order[]; total_orders: number; total_spent: string }> => {
    const queryParams = new URLSearchParams();
    if (params?.search_terms) queryParams.set('search_terms', params.search_terms);
    if (params?.start_date) queryParams.set('start_date', params.start_date);
    if (params?.end_date) queryParams.set('end_date', params.end_date);

    const url = `/api/mcp/customer/${customerId}/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get(url);
  },
};
