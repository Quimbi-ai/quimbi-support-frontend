import { apiClient } from '../lib/api-client';
import type { NextBestAction } from '../types';

// AI Draft Response type
export interface AIDraftResponse {
  ticket_id: string;
  draft: string;
  tone: string;
  length?: string;
  personalization_applied?: string[];
  generated_at: string;
}

export const aiApi = {
  /**
   * Get AI-generated next best action recommendations for a ticket
   */
  getRecommendation: async (ticketId: string): Promise<NextBestAction> => {
    return apiClient.get<NextBestAction>(
      `/api/ai/tickets/${ticketId}/recommendation`
    );
  },

  /**
   * Get AI-generated draft response for a ticket
   */
  getDraftResponse: async (ticketId: string): Promise<AIDraftResponse> => {
    // Add cache-busting parameter to force fresh response
    const cacheBuster = Date.now();
    return apiClient.get<AIDraftResponse>(
      `/api/ai/tickets/${ticketId}/draft-response?_t=${cacheBuster}`
    );
  },

  /**
   * Regenerate AI draft response with different parameters
   */
  regenerateDraft: async (
    ticketId: string,
    params?: {
      tone?: 'friendly' | 'professional' | 'empathetic' | 'apologetic';
      length?: 'short' | 'medium' | 'long';
      include_offer?: boolean;
      template?: string;
      include_actions?: number[];
    }
  ): Promise<AIDraftResponse> => {
    return apiClient.post<AIDraftResponse>(
      `/api/ai/tickets/${ticketId}/draft-response/regenerate`,
      params || {}
    );
  },

  /**
   * Mark an AI recommendation action as completed
   */
  completeAction: async (
    ticketId: string,
    actionIndex: number
  ): Promise<{
    action: {
      action: string;
      priority: number;
      completed: boolean;
      completed_at?: string;
    };
  }> => {
    return apiClient.patch(
      `/api/ai/tickets/${ticketId}/recommendation/actions/${actionIndex}`,
      { completed: true }
    );
  },
};
