// Core data types for Quimbi CRM

// Dynamic behavioral axis configuration (from backend)
export interface BehavioralAxis {
  name: string; // e.g., "purchase_frequency"
  display_name: string; // e.g., "Purchase Frequency"
  description: string;
  category: 'purchase' | 'support';
  segments: BehavioralSegment[];
}

export interface BehavioralSegment {
  name: string; // e.g., "weekly_shopper"
  display_name: string; // e.g., "Weekly Shopper"
  description: string;
  order: number; // For sorting (low to high value)
}

export interface SystemConfiguration {
  axes: BehavioralAxis[];
  axis_count: number;
  version: string;
}

// Customer Profile (with dynamic segments)
export interface CustomerProfile {
  customer_id: string;
  archetype: {
    id: string; // Backend uses "id" not "archetype_id"
    archetype_id?: string; // Alias for compatibility
    level: string;
    member_count?: number;
    population_percentage?: number;
    dominant_segments?: {
      [axisName: string]: string; // Dynamic axis names -> segment names
    };
  } | null; // null for customers without orders
  dominant_segments?: {
    [axisName: string]: string; // Dynamic axis names -> segment names
  };
  segment_memberships?: {
    [axisName: string]: {
      [segmentName: string]: number; // 0-1 membership scores
    };
  };
  business_metrics: {
    lifetime_value: number;
    total_orders: number;
    avg_order_value: number;
    days_since_last_purchase: number | null;
    customer_tenure_days: number;
  };
  churn_risk?: {
    churn_risk_score: number; // 0-1
    risk_level?: ChurnRiskLevel;
    recommendation?: string;
  };
}

export interface Ticket {
  id: string;
  customer_id: string;
  channel: 'email' | 'sms' | 'phone' | 'chat' | 'form';
  status: 'open' | 'pending' | 'closed';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  subject: string;
  messages: Message[];
  notes?: InternalNote[];
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  tags: string[];
  ai_recommendation?: NextBestAction;
  ai_draft_response?: string;
  customer_profile?: CustomerProfile;
}

export interface Message {
  id: string;
  ticket_id: string;
  from_agent: boolean;
  content: string;
  created_at: string;
  author_name?: string;
  author_email?: string;
}

export interface InternalNote {
  id: string;
  ticket_id: string;
  content: string;
  author_name: string;
  author_id: string;
  created_at: string;
}

export interface NextBestAction {
  priority: 'urgent' | 'high' | 'normal';
  actions: {
    action: string;
    completed: boolean;
    priority: number;
    reasoning?: string;
  }[];
  talking_points: string[];
  warnings: string[];
  estimated_impact: {
    retention_probability: number;
    revenue_at_risk: number;
  };
}

export interface Order {
  order_id: string;
  order_number: string;
  created_at: string;
  total_price: string;
  line_items: {
    title: string;
    vendor: string;
    quantity: number;
    price: string;
  }[];
  tracking_numbers?: string[];
  fulfillment_status: string;
}

export interface Archetype {
  archetype_id: string;
  segment_name?: string; // Optional AI-generated name
  description?: string;
  member_count: number;
  population_percentage: number;
  dominant_segments: {
    [axisName: string]: string; // Dynamic axis names -> segment names
  };
  metrics?: {
    avg_ltv: number;
    total_ltv: number;
    avg_orders: number;
    avg_order_value: number;
    churn_rate: number;
  };
  key_traits?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  goal: 'retention' | 'winback' | 'growth' | 'loyalty';
  target_audience: {
    archetype_ids?: string[];
    ltv_min?: number;
    ltv_max?: number;
    churn_risk_min?: number;
    churn_risk_max?: number;
    days_since_last_min?: number;
    days_since_last_max?: number;
  };
  channel: 'email' | 'sms' | 'both';
  message: {
    subject?: string;
    body: string;
    variables: string[];
  };
  schedule: {
    send_at: string | 'immediate';
    timezone: string;
  };
  predicted_performance: {
    reach: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
    projected_revenue: number;
    roi: number;
  };
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
}

export interface ChurnAggregate {
  total_customers: number;
  sample_size: number;
  churn_risk_distribution: {
    critical: {
      count: number;
      percentage: number;
      estimated_total: number;
    };
    high: {
      count: number;
      percentage: number;
      estimated_total: number;
    };
    medium: {
      count: number;
      percentage: number;
      estimated_total: number;
    };
    low: {
      count: number;
      percentage: number;
      estimated_total: number;
    };
  };
  estimated_churn_30_days: number;
  estimated_churn_90_days: number;
  note: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// UI Helper types
export type LTVTier = 'vip' | 'high' | 'standard' | 'low';
export type ChurnRiskLevel = 'critical' | 'high' | 'medium' | 'low';
