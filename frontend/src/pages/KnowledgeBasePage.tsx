/**
 * Knowledge Base Analytics Page
 *
 * AI-powered interface for analyzing ticket data and identifying
 * opportunities for knowledge base article creation.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import knowledgeBaseApi from '../api/knowledge-base';

export default function KnowledgeBasePage() {
  const [view, setView] = useState<'suggestions' | 'issues' | 'trends' | 'draft'>('suggestions');
  const [articleRequest, setArticleRequest] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch article suggestions
  const { data: suggestions, isLoading, error } = useQuery({
    queryKey: ['kb-suggestions', 10],
    queryFn: () => knowledgeBaseApi.getArticleSuggestions(10),
    staleTime: 1000 * 60 * 5,
  });

  const handleGenerateArticle = async () => {
    if (!articleRequest.trim()) return;

    setIsGenerating(true);
    try {
      const result = await knowledgeBaseApi.generateArticle(articleRequest);
      setGeneratedArticle(result.article);
      setView('draft');
    } catch (err) {
      console.error('Error generating article:', err);
      setGeneratedArticle(`# Error Generating Article\n\nFailed to generate article for: ${articleRequest}\n\nPlease try again or contact support if the problem persists.`);
      setView('draft');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ✨ Knowledge Base Analytics
        </h1>
        <p className="text-gray-600">
          AI-powered insights from 31,506 tickets to help you create and prioritize
          knowledge base articles for customer self-service.
        </p>
      </div>

      {/* Article Request Input */}
      <div className="mb-6">
        <label htmlFor="article-request" className="block text-sm font-medium text-gray-700 mb-2">
          Request Custom Article
        </label>
        <div className="flex gap-2">
          <input
            id="article-request"
            type="text"
            value={articleRequest}
            onChange={(e) => setArticleRequest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerateArticle()}
            placeholder="e.g., How to process a return for a defective item"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleGenerateArticle}
            disabled={!articleRequest.trim() || isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Article'}
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setView('suggestions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'suggestions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📄 Article Suggestions
        </button>
        <button
          onClick={() => setView('issues')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'issues'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 Top Issues
        </button>
        <button
          onClick={() => setView('trends')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'trends'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📈 Seasonal Trends
        </button>
        <button
          onClick={() => setView('draft')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'draft'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ✍️ Article Draft
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {view === 'suggestions' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              AI-Generated Article Suggestions
            </h2>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Analyzing tickets...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  Error loading suggestions. Please check that the backend is running.
                </p>
              </div>
            )}

            {suggestions && suggestions.length > 0 && (
              <div className="space-y-4">
                {suggestions.map((article: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">
                          {article.article_title}
                        </h3>
                        <div className="flex gap-2 flex-wrap mb-3">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            article.priority === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : article.priority === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : article.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {article.priority} Priority
                          </span>
                          <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {article.article_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Tickets to Deflect</p>
                        <p className="font-semibold text-gray-900">
                          {article.impact_estimate.tickets_to_deflect.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Customers Affected</p>
                        <p className="font-semibold text-gray-900">
                          {article.impact_estimate.customers_affected.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Resolution Hours</p>
                        <p className="font-semibold text-gray-900">
                          {article.impact_estimate.avg_resolution_hours_saved?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Deflection Potential:</strong> {article.deflection_potential}
                      </p>
                      {article.source_data.sample_subjects.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                            View Sample Questions ({article.source_data.sample_subjects.length})
                          </summary>
                          <ul className="mt-2 space-y-1 ml-4">
                            {article.source_data.sample_subjects.slice(0, 5).map((subject: string, i: number) => (
                              <li key={i} className="text-sm text-gray-600">
                                • {subject}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions && suggestions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No article suggestions available at this time.
              </p>
            )}
          </div>
        )}

        {view === 'issues' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top Deflectable Issues
            </h2>
            <p className="text-gray-600">
              This view shows the top issues that can be deflected with FAQ or How-To articles.
              Backend integration coming soon.
            </p>
          </div>
        )}

        {view === 'trends' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Seasonal Trends
            </h2>
            <p className="text-gray-600">
              This view shows seasonal patterns in ticket volume to help plan articles
              for recurring issues. Backend integration coming soon.
            </p>
          </div>
        )}

        {view === 'draft' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Article Draft
            </h2>
            {generatedArticle ? (
              <div className="prose max-w-none">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800">
                    {generatedArticle}
                  </pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedArticle)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedArticle(null);
                      setArticleRequest('');
                      setView('suggestions');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Create Another Article
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No article has been generated yet.
                </p>
                <p className="text-sm text-gray-400">
                  Use the "Request Custom Article" field above to generate an article.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
