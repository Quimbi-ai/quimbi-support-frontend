import { apiClient } from '../lib/api-client';
import type { Ticket, Message, InternalNote } from '../types';

// Response types for ticket list
export interface TicketListItem {
  id: string;
  customer_id: string;
  channel: 'email' | 'sms' | 'phone' | 'chat' | 'form';
  status: 'open' | 'pending' | 'closed';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  subject: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  tags: string[];
  message_count: number;
  last_message_preview?: string;
  last_message_at?: string;
  last_message_from_agent?: boolean;
  matches_topic_alert?: boolean; // Topic alert match indicator
  smart_score?: number; // AI-calculated priority score
}

export interface TicketListResponse {
  tickets: TicketListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
  filters_applied?: Record<string, any>;
  topic_alerts_active?: string[]; // NEW: Active topic alerts
  matches?: number; // NEW: Count of matching tickets
}

export const ticketApi = {
  /**
   * List all tickets with optional filtering and pagination
   */
  list: async (params?: {
    status?: 'open' | 'pending' | 'closed';
    priority?: 'urgent' | 'high' | 'normal' | 'low';
    channel?: 'email' | 'sms' | 'phone' | 'chat' | 'form';
    assigned_to?: string;
    customer_id?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    topic_alerts?: string; // NEW: Comma-separated topic alerts
  }): Promise<TicketListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.channel) queryParams.append('channel', params.channel);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.topic_alerts) queryParams.append('topic_alerts', params.topic_alerts); // NEW

    // Always enable smart ordering
    queryParams.append('smart_order', 'true');

    const url = `/api/tickets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<TicketListResponse>(url);
  },

  /**
   * Get full ticket details including messages, customer profile, and AI recommendations
   */
  getById: async (ticketId: string): Promise<Ticket> => {
    return apiClient.get<Ticket>(`/api/tickets/${ticketId}`);
  },

  /**
   * Create a new ticket
   */
  create: async (ticketData: {
    customer_id: string;
    subject: string;
    channel: 'email' | 'sms' | 'phone' | 'chat' | 'form';
    priority?: 'urgent' | 'high' | 'normal' | 'low';
    status?: 'open' | 'pending' | 'closed';
    tags?: string[];
    initial_message?: string;
    author_name: string;
    author_email?: string;
  }): Promise<{ ticket: Ticket; messages: Message[]; notes: InternalNote[] }> => {
    return apiClient.post<{ ticket: Ticket; messages: Message[]; notes: InternalNote[] }>('/api/tickets', ticketData);
  },

  /**
   * Update ticket metadata (status, priority, assignment, tags)
   */
  update: async (
    ticketId: string,
    updates: {
      status?: 'open' | 'pending' | 'closed';
      priority?: 'urgent' | 'high' | 'normal' | 'low';
      assigned_to?: string;
      tags?: string[];
      add_tags?: string[];
      remove_tags?: string[];
    }
  ): Promise<{ ticket: Partial<Ticket> }> => {
    return apiClient.patch<{ ticket: Partial<Ticket> }>(
      `/api/tickets/${ticketId}`,
      updates
    );
  },

  /**
   * Send a message (reply to ticket)
   */
  sendMessage: async (
    ticketId: string,
    messageData: {
      content: string;
      from_agent?: boolean;
      author_name?: string;
      author_email?: string;
      send_to_customer?: boolean;
      close_ticket?: boolean;
    }
  ): Promise<{ message: Message; ticket_updated: Partial<Ticket> }> => {
    return apiClient.post<{ message: Message; ticket_updated: Partial<Ticket> }>(
      `/api/tickets/${ticketId}/messages`,
      {
        from_agent: true,
        send_to_customer: true,
        author_name: 'Support Agent', // Default agent name
        ...messageData,
      }
    );
  },

  /**
   * Add an internal note to a ticket (not sent to customer)
   */
  addNote: async (
    ticketId: string,
    noteData: {
      content: string;
      author_name: string;
      author_id: string;
    }
  ): Promise<{ note: InternalNote }> => {
    return apiClient.post<{ note: InternalNote }>(
      `/api/tickets/${ticketId}/notes`,
      noteData
    );
  },

  /**
   * Get all internal notes for a ticket
   */
  getNotes: async (ticketId: string): Promise<{ notes: InternalNote[] }> => {
    return apiClient.get<{ notes: InternalNote[] }>(`/api/tickets/${ticketId}/notes`);
  },

  /**
   * Reset conversation by deleting all messages except the first one
   */
  resetConversation: async (ticketId: string): Promise<{ status: string; messages_deleted: number }> => {
    return apiClient.post<{ status: string; messages_deleted: number }>(
      `/api/tickets/${ticketId}/reset-conversation`
    );
  },
};
