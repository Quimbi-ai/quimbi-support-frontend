/**
 * Knowledge Base Analytics Page - Simplified Version
 */

import { useState } from 'react';

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Knowledge Base Analytics
      </h1>
      <p className="text-gray-600 mb-8">
        AI-powered insights from 31,506 tickets to help you create and prioritize
        knowledge base articles for customer self-service.
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          The Knowledge Base analytics dashboard is being configured.
          This page will show AI-generated article suggestions based on ticket analysis.
        </p>
      </div>
    </div>
  );
}
