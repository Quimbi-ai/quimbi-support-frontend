import { Badge } from './ui/Badge';
import type { ChurnRiskLevel } from '../types';
import { formatPercentage } from '../utils/formatting';

interface ChurnRiskBadgeProps {
  riskLevel: ChurnRiskLevel;
  riskScore?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ChurnRiskBadge({
  riskLevel,
  riskScore,
  showScore = true,
  size = 'md',
}: ChurnRiskBadgeProps) {
  const icons = {
    critical: '🔴',
    high: '🟡',
    medium: '🔵',
    low: '🟢',
  };

  const variants = {
    critical: 'danger' as const,
    high: 'warning' as const,
    medium: 'info' as const,
    low: 'success' as const,
  };

  return (
    <Badge variant={variants[riskLevel]} size={size}>
      {icons[riskLevel]} {riskLevel.toUpperCase()}
      {showScore && riskScore !== undefined && ` • ${formatPercentage(riskScore)}`}
    </Badge>
  );
}
