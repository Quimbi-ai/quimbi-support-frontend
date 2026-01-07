import { format, formatDistanceToNow } from 'date-fns';
import type { LTVTier, ChurnRiskLevel } from '../types';

// LTV Formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getLTVTier(ltv: number): {
  tier: LTVTier;
  color: string;
  label: string;
} {
  if (ltv >= 2000) {
    return {
      tier: 'vip',
      color: 'purple',
      label: 'VIP',
    };
  }
  if (ltv >= 500) {
    return {
      tier: 'high',
      color: 'blue',
      label: 'High Value',
    };
  }
  if (ltv >= 100) {
    return {
      tier: 'standard',
      color: 'green',
      label: 'Standard',
    };
  }
  return {
    tier: 'low',
    color: 'gray',
    label: 'Low Value',
  };
}

// Churn Risk Formatting
export function getChurnRiskColor(riskLevel: ChurnRiskLevel): string {
  const colors = {
    critical: '#DC2626', // red-600
    high: '#F59E0B', // amber-500
    medium: '#3B82F6', // blue-500
    low: '#10B981', // green-500
  };
  return colors[riskLevel];
}

export function getChurnRiskBadgeColor(riskLevel: ChurnRiskLevel): string {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-amber-100 text-amber-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-green-100 text-green-800',
  };
  return colors[riskLevel];
}

// Date Formatting
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Text Formatting
export function formatSegmentName(segment: string): string {
  return segment
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Number Formatting
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
