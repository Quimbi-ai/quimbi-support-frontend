import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../api/customers';
import { Card, CardHeader, CardBody } from './ui/Card';
import { LTVBadge } from './LTVBadge';
import { ChurnRiskBadge } from './ChurnRiskBadge';
import { Badge } from './ui/Badge';
import { formatCurrency, formatSegmentName } from '../utils/formatting';

interface CustomerIntelligenceSidebarProps {
  customerId: string;
}

export function CustomerIntelligenceSidebar({ customerId }: CustomerIntelligenceSidebarProps) {
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.getById(customerId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardBody className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardBody>
      </Card>
    );
  }

  if (error || !customer) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-red-600">Error loading customer data</p>
        </CardBody>
      </Card>
    );
  }

  // Convert churn risk score to level
  const getChurnRiskLevel = (score: number) => {
    if (score >= 0.7) return 'critical';
    if (score >= 0.5) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  };

  const churnScore = customer.churn_risk?.churn_risk_score;
  const churnLevel = churnScore ? getChurnRiskLevel(churnScore) : undefined;

  return (
    <div className="space-y-4">
      {/* Customer Intelligence Card */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900">👤 Customer Intelligence</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Customer ID */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer ID</div>
            <div className="text-sm font-mono text-gray-900">{customer.customer_id}</div>
          </div>

          {/* LTV & Churn Badges */}
          <div className="space-y-2">
            <LTVBadge ltv={customer.business_metrics.lifetime_value} size="md" />
            {churnLevel && churnScore !== undefined && (
              <ChurnRiskBadge
                riskLevel={churnLevel as any}
                riskScore={churnScore}
                size="md"
              />
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">Total Orders</div>
              <div className="text-lg font-bold text-gray-900">
                {customer.business_metrics.total_orders}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Avg Order</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(customer.business_metrics.avg_order_value)}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500">Days Since Last Purchase</div>
              <div className="text-lg font-bold text-gray-900">
                {customer.business_metrics.days_since_last_purchase ?? 'N/A'}
                {customer.business_metrics.days_since_last_purchase !== null &&
                  customer.business_metrics.days_since_last_purchase > 30 && (
                    <span className="text-xs text-amber-600 ml-2">⚠️ Inactive</span>
                  )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Behavioral Archetype */}
      {customer.archetype && customer.archetype.archetype_id ? (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">🎯 Behavioral Profile</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <Badge variant="info" size="sm">
                {customer.archetype.archetype_id}
              </Badge>
              {customer.archetype.population_percentage && customer.archetype.member_count && (
                <p className="text-xs text-gray-500 mt-1">
                  Top {(customer.archetype.population_percentage * 100).toFixed(1)}% • {customer.archetype.member_count} similar
                </p>
              )}
            </div>

            {/* Key Behavioral Traits */}
            {customer.archetype.dominant_segments && Object.keys(customer.archetype.dominant_segments).length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700 uppercase">Key Traits</div>
                {Object.entries(customer.archetype.dominant_segments)
                  .slice(0, 5) // Show first 5 traits
                  .map(([axis, segment]) => (
                    <div key={axis} className="flex items-start">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-1 mr-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900">
                          {formatSegmentName(String(segment))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatSegmentName(axis)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="text-center py-6">
            <p className="text-xs text-gray-500">
              New customer - awaiting first purchase
            </p>
          </CardBody>
        </Card>
      )}

      {/* Churn Risk Details */}
      {churnLevel && churnLevel !== 'low' && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <h3 className="text-sm font-semibold text-amber-900">⚠️ Retention Alert</h3>
          </CardHeader>
          <CardBody>
            <p className="text-xs text-amber-800 mb-2">
              <strong>Risk Level:</strong> {churnLevel.toUpperCase()}
            </p>
            <p className="text-xs text-gray-700">
              This customer shows {churnLevel} churn risk. Consider proactive engagement.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
