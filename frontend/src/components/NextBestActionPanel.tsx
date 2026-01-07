import { useState } from 'react';
import { Card, CardHeader, CardBody } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import type { NextBestAction } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatting';

interface NextBestActionPanelProps {
  recommendation: NextBestAction;
  onGenerateResponse: (selectedActions: number[]) => void;
}

export function NextBestActionPanel({ recommendation, onGenerateResponse }: NextBestActionPanelProps) {
  const [selectedActions, setSelectedActions] = useState<number[]>([]);

  const toggleAction = (idx: number) => {
    setSelectedActions(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleGenerate = () => {
    onGenerateResponse(selectedActions);
  };
  const priorityColors = {
    urgent: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-amber-100 text-amber-800 border-amber-300',
    normal: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const priorityIcons = {
    urgent: '🔴',
    high: '🟡',
    normal: '🔵',
  };

  return (
    <Card className={`border-2 ${priorityColors[recommendation.priority]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            🤖 AI Next Best Action
          </h3>
          <Badge
            variant={recommendation.priority === 'urgent' ? 'danger' : recommendation.priority === 'high' ? 'warning' : 'info'}
            size="sm"
          >
            {priorityIcons[recommendation.priority]} {recommendation.priority.toUpperCase()} PRIORITY
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Warnings */}
        {recommendation.warnings && recommendation.warnings.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <span className="text-red-600 mr-2">⚠️</span>
              <div className="flex-1">
                <div className="text-xs font-semibold text-red-900 mb-1">IMPORTANT</div>
                <ul className="text-xs text-red-800 space-y-1">
                  {recommendation.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Estimated Impact */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-blue-900 mb-2">📊 Estimated Impact</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-blue-700">Retention Probability</div>
              <div className="text-lg font-bold text-blue-900">
                {formatPercentage(recommendation.estimated_impact.retention_probability)}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700">Revenue at Risk</div>
              <div className="text-lg font-bold text-blue-900">
                {formatCurrency(recommendation.estimated_impact.revenue_at_risk)}
              </div>
            </div>
          </div>
        </div>

        {/* Response Options */}
        <div>
          <div className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            ✨ Response Options - Select what to include
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Choose which elements to include in the AI-generated response
          </p>
          <div className="space-y-2">
            {recommendation.actions
              .map((action, originalIdx) => ({ action, originalIdx }))
              .sort((a, b) => a.action.priority - b.action.priority)
              .map(({ action, originalIdx }) => {
                const isSelected = selectedActions.includes(originalIdx);
                return (
                  <div
                    key={originalIdx}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleAction(originalIdx)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAction(originalIdx)}
                      className="mt-0.5 mr-3 h-4 w-4 text-blue-600 rounded cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {action.action}
                      </div>
                      {action.reasoning && (
                        <div className="text-xs text-gray-600">
                          {action.reasoning}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={action.priority === 1 ? 'danger' : action.priority === 2 ? 'warning' : 'default'}
                      size="sm"
                      className="ml-2"
                    >
                      P{action.priority}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Talking Points */}
        <div>
          <div className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            💬 Talking Points
          </div>
          <ul className="space-y-1.5">
            {recommendation.talking_points.map((point, idx) => (
              <li key={idx} className="flex items-start text-sm text-gray-700">
                <span className="text-primary-500 mr-2">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Generate Response Button */}
        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-xs text-gray-600">
            {selectedActions.length} option{selectedActions.length !== 1 ? 's' : ''} selected
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={selectedActions.length === 0}
          >
            ✨ Generate Response
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
