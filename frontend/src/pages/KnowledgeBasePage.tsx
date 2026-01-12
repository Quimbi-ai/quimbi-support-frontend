/**
 * Knowledge Base Analytics Page
 *
 * AI-powered interface for analyzing ticket data and identifying
 * opportunities for knowledge base article creation.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import knowledgeBaseApi, {
  DeflectableIssue,
  ArticleSuggestion,
  SeasonalTrend,
} from '../api/knowledge-base';

const KnowledgeBasePage: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<DeflectableIssue | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleSuggestion | null>(null);
  const [view, setView] = useState<'top-issues' | 'article-suggestions' | 'trends'>('article-suggestions');

  // Fetch top deflectable issues
  const {
    data: topIssues,
    isLoading: issuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ['kb-top-issues', 10, 50],
    queryFn: () => knowledgeBaseApi.getTopDeflectableIssues(10, 50),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch article suggestions
  const {
    data: articleSuggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useQuery({
    queryKey: ['kb-article-suggestions', 10],
    queryFn: () => knowledgeBaseApi.getArticleSuggestions(10),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch seasonal trends
  const {
    data: seasonalTrends,
    isLoading: trendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['kb-seasonal-trends', 12],
    queryFn: () => knowledgeBaseApi.getSeasonalTrends(12),
    staleTime: 1000 * 60 * 10,
  });

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'red';
      case 'High':
        return 'orange';
      case 'Medium':
        return 'yellow';
      case 'Low':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Helper function to get article type icon
  const getArticleTypeIcon = (type: string) => {
    if (type.includes('How-To')) return '📘';
    if (type.includes('FAQ')) return '❓';
    if (type.includes('Policy')) return '📋';
    if (type.includes('Product')) return '🛍️';
    if (type.includes('Troubleshooting')) return '🔧';
    return '📄';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Knowledge Base Analytics
            </h1>
          </div>
          <p className="text-gray-600">
            AI-powered insights from 31,506 tickets to help you create and prioritize
            knowledge base articles for customer self-service.
          </p>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={view === 'article-suggestions' ? 'primary' : 'secondary'}
            onClick={() => setView('article-suggestions')}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Article Suggestions
          </Button>
          <Button
            variant={view === 'top-issues' ? 'primary' : 'secondary'}
            onClick={() => setView('top-issues')}
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Top Issues
          </Button>
          <Button
            variant={view === 'trends' ? 'primary' : 'secondary'}
            onClick={() => setView('trends')}
          >
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
            Seasonal Trends
          </Button>
        </div>

        {/* Article Suggestions View */}
        {view === 'article-suggestions' && (
          <div>
            {suggestionsLoading && (
              <Card>
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="ml-4 text-gray-600">Analyzing tickets to generate article suggestions...</p>
                </div>
              </Card>
            )}

            {suggestionsError && (
              <Card>
                <div className="text-center py-12 text-red-600">
                  Error loading article suggestions. Please try again.
                </div>
              </Card>
            )}

            {articleSuggestions && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suggestions List */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Ready-to-Write Articles ({articleSuggestions.length})
                  </h2>

                  {articleSuggestions.map((article, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-all ${
                        selectedArticle === article
                          ? 'ring-2 ring-purple-500 shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">{getArticleTypeIcon(article.article_type)}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {article.article_title}
                            </h3>
                            <div className="flex gap-2 flex-wrap">
                              <Badge color={getPriorityColor(article.priority)}>
                                {article.priority}
                              </Badge>
                              <Badge color="blue">{article.article_type}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Tickets to Deflect</p>
                          <p className="font-semibold text-gray-900">
                            {article.impact_estimate.tickets_to_deflect.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Customers</p>
                          <p className="font-semibold text-gray-900">
                            {article.impact_estimate.customers_affected.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Hours</p>
                          <p className="font-semibold text-gray-900">
                            {article.impact_estimate.avg_resolution_hours_saved?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          {article.deflection_potential}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Article Detail Panel */}
                <div className="lg:sticky lg:top-6 lg:h-fit">
                  {selectedArticle ? (
                    <Card>
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-4xl">
                            {getArticleTypeIcon(selectedArticle.article_type)}
                          </span>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {selectedArticle.article_title}
                            </h2>
                            <p className="text-sm text-gray-500">
                              Based on #{selectedArticle.source_data.tag}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge color={getPriorityColor(selectedArticle.priority)}>
                            {selectedArticle.priority} Priority
                          </Badge>
                          <Badge color="blue">{selectedArticle.article_type}</Badge>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Impact */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Expected Impact
                          </h3>
                          <div className="bg-green-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">Tickets to Deflect:</span>
                              <span className="font-semibold text-green-700">
                                {selectedArticle.impact_estimate.tickets_to_deflect.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">Customers Helped:</span>
                              <span className="font-semibold text-green-700">
                                {selectedArticle.impact_estimate.customers_affected.toLocaleString()}
                              </span>
                            </div>
                            {selectedArticle.impact_estimate.avg_resolution_hours_saved && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-700">Hours Saved:</span>
                                <span className="font-semibold text-green-700">
                                  ~{selectedArticle.impact_estimate.avg_resolution_hours_saved.toFixed(1)} per ticket
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recommended Sections */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Recommended Sections
                          </h3>
                          <ul className="space-y-2">
                            {selectedArticle.recommended_sections.map((section, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                {section}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Sample Customer Questions */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Sample Customer Questions
                          </h3>
                          <div className="space-y-2">
                            {selectedArticle.source_data.sample_subjects.slice(0, 5).map((subject, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-gray-700">{subject}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Primary Channel */}
                        {selectedArticle.source_data.primary_channel && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                              Primary Channel
                            </h3>
                            <Badge color="purple">
                              {selectedArticle.source_data.primary_channel}
                            </Badge>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button variant="primary" className="w-full">
                          <DocumentTextIcon className="h-5 w-5 mr-2" />
                          Create This Article
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-gray-500">
                        <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p>Select an article suggestion to view details</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Issues View */}
        {view === 'top-issues' && (
          <div>
            {issuesLoading && (
              <Card>
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="ml-4 text-gray-600">Analyzing ticket patterns...</p>
                </div>
              </Card>
            )}

            {issuesError && (
              <Card>
                <div className="text-center py-12 text-red-600">
                  Error loading top issues. Please try again.
                </div>
              </Card>
            )}

            {topIssues && (
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Top Deflectable Issues ({topIssues.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Topic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tickets
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resolution Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Article Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topIssues.map((issue, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedIssue(issue)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {issue.issue_topic}
                            </div>
                            <div className="text-sm text-gray-500">
                              {issue.unique_customers.toLocaleString()} customers
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge color={getPriorityColor(issue.priority_level)}>
                              {issue.priority_level}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.ticket_count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.resolution_rate_pct.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.avg_resolution_hours?.toFixed(1) || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge color="blue">{issue.recommended_article_type}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Seasonal Trends View */}
        {view === 'trends' && (
          <div>
            {trendsLoading && (
              <Card>
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="ml-4 text-gray-600">Analyzing seasonal patterns...</p>
                </div>
              </Card>
            )}

            {trendsError && (
              <Card>
                <div className="text-center py-12 text-red-600">
                  Error loading seasonal trends. Please try again.
                </div>
              </Card>
            )}

            {seasonalTrends && (
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Seasonal Ticket Trends (Last 12 Months)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seasonalTrends.map((trend, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{trend.tag}</h3>
                        <Badge
                          color={
                            trend.trend_pattern === 'Highly Seasonal'
                              ? 'red'
                              : trend.trend_pattern === 'Moderately Seasonal'
                              ? 'orange'
                              : 'green'
                          }
                        >
                          {trend.trend_pattern}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Tickets:</span>
                          <span className="font-semibold text-gray-900">
                            {trend.total_tickets.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg Monthly:</span>
                          <span className="font-semibold text-gray-900">
                            {trend.avg_monthly_tickets.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Peak Month:</span>
                          <span className="font-semibold text-gray-900">
                            {trend.peak_monthly_tickets}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
    </div>
  );
};

export default KnowledgeBasePage;
