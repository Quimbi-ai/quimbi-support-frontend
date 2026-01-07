import { Card, CardBody } from '../components/ui/Card';

export function AnalyticsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customer insights and behavioral analytics
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardBody className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Analytics Dashboard Coming Soon
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            We're building comprehensive analytics including churn distribution,
            top archetypes, revenue forecasts, and natural language queries.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
