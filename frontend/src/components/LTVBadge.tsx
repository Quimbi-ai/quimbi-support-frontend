import { Badge } from './ui/Badge';
import { getLTVTier, formatCurrency } from '../utils/formatting';

interface LTVBadgeProps {
  ltv: number;
  showAmount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LTVBadge({ ltv, showAmount = true, size = 'md' }: LTVBadgeProps) {
  const { color, label } = getLTVTier(ltv);

  const colorClasses = {
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge
      variant="default"
      size={size}
      className={colorClasses[color as keyof typeof colorClasses]}
    >
      💎 {label}
      {showAmount && ` • ${formatCurrency(ltv)}`}
    </Badge>
  );
}
