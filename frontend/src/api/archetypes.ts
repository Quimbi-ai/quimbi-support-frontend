import { apiClient } from '../lib/api-client';

export interface Archetype {
  archetype_id: string;
  store_id: string;
  description: string;
  dominant_segments: Record<string, string>;
  member_count: number;
  population_percentage: number;
  avg_ltv: number;
  total_ltv: number;
}

export interface ArchetypesResponse {
  metric: string;
  store_id: string | null;
  top_archetypes: Archetype[];
  total_returned: number;
}

export const archetypesApi = {
  // Get top archetypes with optional filtering by store/game
  getTop: async (params?: {
    metric?: 'total_ltv' | 'avg_ltv' | 'member_count';
    limit?: number;
    store_id?: string;
  }): Promise<ArchetypesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.metric) queryParams.set('metric', params.metric);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.store_id) queryParams.set('store_id', params.store_id);

    const url = `/api/mcp/archetypes/top${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<ArchetypesResponse>(url);
  },
};
