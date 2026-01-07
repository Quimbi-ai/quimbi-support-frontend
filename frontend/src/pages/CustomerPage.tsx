import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../api/customers';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, getLTVTier, getChurnRiskBadgeColor } from '../utils/formatting';

export function CustomerPage() {
  const { customerId } = useParams<{ customerId: string }>();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.getById(customerId!),
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading customer profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-red-600">Error loading customer profile</p>
          <p className="text-sm text-gray-500 mt-2">{(error as Error).message}</p>
        </CardBody>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-gray-500">Customer not found</p>
        </CardBody>
      </Card>
    );
  }

  const ltvTier = getLTVTier(customer.business_metrics.lifetime_value);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Profile</h1>
            <p className="mt-1 text-sm text-gray-500">ID: {customer.customer_id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="default" className={`bg-${ltvTier.color}-100 text-${ltvTier.color}-800`}>
              💎 {ltvTier.label}
            </Badge>
            {customer.churn_risk && customer.churn_risk.risk_level && (
              <Badge className={getChurnRiskBadgeColor(customer.churn_risk.risk_level)}>
                ⚠️ {customer.churn_risk.risk_level.toUpperCase()} Risk
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-sm text-gray-500">Lifetime Value</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(customer.business_metrics.lifetime_value)}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">
              {customer.business_metrics.total_orders}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-gray-500">Avg Order Value</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(customer.business_metrics.avg_order_value)}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-sm text-gray-500">Days Since Last Purchase</div>
            <div className="text-2xl font-bold text-gray-900">
              {customer.business_metrics.days_since_last_purchase ?? 'N/A'}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Archetype Info */}
      {customer.archetype ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Behavioral Archetype</h2>
          </CardHeader>
          <CardBody>
            <div className="mb-4">
              <Badge variant="info" size="lg">
                🎯 {customer.archetype.archetype_id}
              </Badge>
              <p className="mt-2 text-sm text-gray-600">
                {customer.archetype.population_percentage !== undefined && (
                  <>Top {customer.archetype.population_percentage.toFixed(1)}%</>
                )}
                {customer.archetype.member_count !== undefined && (
                  <> • {customer.archetype.member_count} similar customers</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {customer.archetype.dominant_segments && Object.entries(customer.archetype.dominant_segments).map(([axis, segment]) => (
                <div key={axis} className="border-l-2 border-primary-500 pl-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {axis.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mt-1">
                    {segment.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardBody className="text-center py-8">
            <p className="text-gray-500">
              New customer - awaiting first purchase to analyze behavior
            </p>
          </CardBody>
        </Card>
      )}

      {/* Churn Risk */}
      {customer.churn_risk && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Churn Risk Analysis</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-start justify-between mb-4">
              <div>
                {customer.churn_risk.risk_level && (
                  <Badge className={getChurnRiskBadgeColor(customer.churn_risk.risk_level)} size="lg">
                    {customer.churn_risk.risk_level.toUpperCase()} RISK
                  </Badge>
                )}
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {Math.round(customer.churn_risk.churn_risk_score * 100)}% chance of churn
                </p>
              </div>
            </div>

            {customer.churn_risk.recommendation && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Recommendation:</strong> {customer.churn_risk.recommendation}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
