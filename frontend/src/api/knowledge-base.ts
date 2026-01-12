/**
 * Knowledge Base Analytics API Client
 *
 * Provides methods to interact with the Knowledge Base MCP server
 * for analyzing ticket data and generating KB article suggestions.
 */

import apiClient from '../lib/api-client';

export interface DeflectableIssue {
  issue_topic: string;
  ticket_count: number;
  closed_count: number;
  resolution_rate_pct: number;
  avg_resolution_hours: number | null;
  channels: string[];
  unique_customers: number;
  priority_level: 'Critical' | 'High' | 'Medium' | 'Low';
  deflection_potential: string;
  recommended_article_type: string;
}

export interface TicketSubject {
  subject: string;
  status: string;
  channel: string;
  created_at: string | null;
  closed_at: string | null;
  resolution_hours: number | null;
}

export interface CommonPhrase {
  phrase: string;
  occurrences: number;
}

export interface SeasonalTrend {
  tag: string;
  total_tickets: number;
  avg_monthly_tickets: number;
  peak_monthly_tickets: number;
  trend_pattern: 'Highly Seasonal' | 'Moderately Seasonal' | 'Consistent Volume';
}

export interface ChannelDistribution {
  channel: string;
  ticket_count: number;
  percentage: number;
}

export interface ChannelPatterns {
  tag: string;
  channel_distribution: ChannelDistribution[];
  primary_channel: string | null;
  recommendation: string;
}

export interface ArticleSuggestion {
  article_title: string;
  article_type: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  impact_estimate: {
    tickets_to_deflect: number;
    customers_affected: number;
    avg_resolution_hours_saved: number | null;
  };
  source_data: {
    tag: string;
    sample_subjects: string[];
    primary_channel: string | null;
  };
  recommended_sections: string[];
  deflection_potential: string;
}

export interface KBAnalyticsResponse<T> {
  data: T;
  timestamp: string;
  tool_used: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  mcp_server_available: boolean;
  database_configured: boolean;
  timestamp: string;
  error?: string;
}

/**
 * Knowledge Base Analytics API
 */
export const knowledgeBaseApi = {
  /**
   * Get top issues that can be deflected with FAQ/How-To articles
   */
  getTopDeflectableIssues: async (
    limit: number = 5,
    minTickets: number = 50,
    daysBack?: number
  ): Promise<DeflectableIssue[]> => {
    const response = await apiClient.post<KBAnalyticsResponse<{ issues: DeflectableIssue[] }>>(
      '/api/knowledge-base/top-deflectable-issues',
      {
        limit,
        min_tickets: minTickets,
        days_back: daysBack,
      }
    );
    return response.data.issues;
  },

  /**
   * Get sample ticket subjects for a specific tag
   */
  getTicketSubjects: async (
    tag: string,
    limit: number = 20
  ): Promise<TicketSubject[]> => {
    const response = await apiClient.post<KBAnalyticsResponse<{ subjects: TicketSubject[]; tag: string }>>(
      '/api/knowledge-base/ticket-subjects',
      { tag, limit }
    );
    return response.subjects;
  },

  /**
   * Find common phrases customers use for a specific tag
   */
  getCommonPhrases: async (
    tag: string,
    minOccurrences: number = 5
  ): Promise<CommonPhrase[]> => {
    const response = await apiClient.post<KBAnalyticsResponse<{ phrases: CommonPhrase[]; tag: string }>>(
      '/api/knowledge-base/common-phrases',
      { tag, min_occurrences: minOccurrences }
    );
    return response.phrases;
  },

  /**
   * Analyze seasonal ticket trends
   */
  getSeasonalTrends: async (
    monthsBack: number = 12
  ): Promise<SeasonalTrend[]> => {
    const response = await apiClient.post<KBAnalyticsResponse<{ trends: SeasonalTrend[] }>>(
      '/api/knowledge-base/seasonal-trends',
      { months_back: monthsBack }
    );
    return response.trends;
  },

  /**
   * Analyze channel patterns for a specific tag
   */
  getChannelPatterns: async (tag: string): Promise<ChannelPatterns> => {
    const response = await apiClient.post<KBAnalyticsResponse<ChannelPatterns>>(
      '/api/knowledge-base/channel-patterns',
      { tag }
    );
    return response.data;
  },

  /**
   * Get comprehensive KB article suggestions
   */
  getArticleSuggestions: async (
    limit: number = 10
  ): Promise<ArticleSuggestion[]> => {
    const response = await apiClient.post<KBAnalyticsResponse<{ suggestions: ArticleSuggestion[] }>>(
      '/api/knowledge-base/article-suggestions',
      { limit }
    );
    return response.suggestions;
  },

  /**
   * Check KB analytics service health
   */
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>(
      '/api/knowledge-base/health'
    );
    return response;
  },
};

export default knowledgeBaseApi;
