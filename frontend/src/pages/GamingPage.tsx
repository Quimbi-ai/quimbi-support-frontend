import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { archetypesApi } from '../api/archetypes';
import type { Archetype } from '../api/archetypes';

type GameTab = 'assassins_creed' | 'nba2k';

export function GamingPage() {
  const [activeTab, setActiveTab] = useState<GameTab>('assassins_creed');

  // Fetch archetypes for the active game tab only
  const { data: archetypesData, isLoading } = useQuery({
    queryKey: ['gaming-archetypes', activeTab],
    queryFn: () => archetypesApi.getTop({
      store_id: activeTab,
      metric: 'total_ltv',
      limit: 10,
    }),
  });

  const archetypes = archetypesData?.top_archetypes || [];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-xl font-bold mb-4">Gaming Archetypes</h1>

      {/* Game Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('assassins_creed')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assassins_creed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assassin's Creed
          </button>
          <button
            onClick={() => setActiveTab('nba2k')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'nba2k'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            NBA 2K
          </button>
        </nav>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">Loading archetypes...</div>
      )}

      {/* Archetype Cards */}
      {!isLoading && archetypes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {archetypes.map((archetype) => (
            <ArchetypeCard key={archetype.archetype_id} archetype={archetype} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && archetypes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No archetypes found for {activeTab === 'assassins_creed' ? "Assassin's Creed" : 'NBA 2K'}
        </div>
      )}
    </div>
  );
}

function ArchetypeCard({ archetype }: { archetype: Archetype }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">
          {formatArchetypeName(archetype.archetype_id)}
        </h3>
        <p className="text-sm text-gray-600">{archetype.description}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Population</div>
          <div className="text-sm font-medium">
            {archetype.population_percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            ({archetype.member_count.toLocaleString()} players)
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Avg Spend</div>
          <div className="text-sm font-medium">${archetype.avg_ltv.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Value</div>
          <div className="text-sm font-medium">${archetype.total_ltv.toLocaleString()}</div>
        </div>
      </div>

      {/* Behavioral Traits */}
      <div>
        <div className="text-xs text-gray-500 mb-2">Behavioral Profile</div>
        <div className="space-y-1">
          {Object.entries(archetype.dominant_segments).map(([axis, segment]) => (
            <BehavioralTrait key={axis} axis={axis} segment={segment as string} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BehavioralTrait({ axis, segment }: { axis: string; segment: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 min-w-[140px]">{formatAxisName(axis)}:</span>
      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
        {formatSegmentName(segment)}
      </span>
    </div>
  );
}

// Helper functions
function formatArchetypeName(archetypeId: string): string {
  // Extract the descriptive part from IDs like "arch_ac_completionist"
  const parts = archetypeId.split('_');
  const nameParts = parts.slice(2); // Skip "arch" and game prefix
  return nameParts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatAxisName(axis: string): string {
  return axis
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatSegmentName(segment: string): string {
  return segment
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
