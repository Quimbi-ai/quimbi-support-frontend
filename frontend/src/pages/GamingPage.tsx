import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GamingTicket {
  id: string;
  customer_id: string;
  player_name: string;
  game: 'Assassins Creed' | 'NBA 2K';
  archetype: string;
  subject: string;
  preview: string;
  priority: string;
  smart_score: number;
  created_at: string;
  channel: string;
  spend: number;
  playtime_hours: number;
}

// Fake gaming tickets based on archetypes
const GAMING_TICKETS: GamingTicket[] = [
  // NBA 2K - Competitive Whale (player 9000005)
  {
    id: 'gaming_001',
    customer_id: '9000005',
    player_name: 'ProStriker23',
    game: 'NBA 2K',
    archetype: 'Competitive Whale',
    subject: 'MyTeam ranked matchmaking is broken - losing rating unfairly',
    preview: "I just lost 50 rating points because of server lag in a ranked match. I've spent $2800+ on this game and this is unacceptable. I need my rating restored immediately or I'm done with 2K.",
    priority: 'urgent',
    smart_score: 9.5,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
    channel: 'email',
    spend: 2847.50,
    playtime_hours: 847,
  },
  // Assassin's Creed - Completionist (player 9000001)
  {
    id: 'gaming_002',
    customer_id: '9000001',
    player_name: 'AchievementHunter',
    game: 'Assassins Creed',
    archetype: 'Completionist Explorer',
    subject: 'Valhalla DLC trophy glitched - blocking 100% completion',
    preview: "The Wrath of the Druids DLC has a bugged trophy that won't unlock even though I've completed all requirements. I'm at 99.8% completion and this is the only thing stopping me from platinum. I've bought every DLC day one.",
    priority: 'high',
    smart_score: 8.2,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    channel: 'chat',
    spend: 189.99,
    playtime_hours: 312,
  },
  // NBA 2K - Dream Team Collector (player 9000006)
  {
    id: 'gaming_003',
    customer_id: '9000006',
    player_name: 'LakersForever',
    game: 'NBA 2K',
    archetype: 'Dream Team Collector',
    subject: 'Missing Kobe Bryant card from Lakers Historic pack',
    preview: "I just opened the all-time Lakers pack and didn't get the guaranteed Kobe card. This was the whole reason I bought it. Can you please check my account?",
    priority: 'normal',
    smart_score: 7.1,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    channel: 'email',
    spend: 487.25,
    playtime_hours: 156,
  },
  // Assassin's Creed - Stealth Purist (player 9000002)
  {
    id: 'gaming_004',
    customer_id: '9000002',
    player_name: 'ShadowBlade',
    game: 'Assassins Creed',
    archetype: 'Stealth Purist',
    subject: 'Mirage stealth mechanics feel different after patch',
    preview: "Since the last update, enemies seem to detect me through walls. The stealth gameplay that made me buy Mirage specifically is broken. Is this intentional or a bug?",
    priority: 'normal',
    smart_score: 6.3,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    channel: 'email',
    spend: 89.99,
    playtime_hours: 89,
  },
  // NBA 2K - MyCareer Roleplayer (player 9000008)
  {
    id: 'gaming_005',
    customer_id: '9000008',
    player_name: 'StoryMode_Sam',
    game: 'NBA 2K',
    archetype: 'MyCareer Roleplayer',
    subject: 'Purchased tattoo bundle not appearing on MyPlayer',
    preview: "I bought the premium tattoo customization pack but none of the tattoos are showing up in my MyCareer character's customization menu. Receipt attached.",
    priority: 'normal',
    smart_score: 5.8,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    channel: 'email',
    spend: 287.50,
    playtime_hours: 203,
  },
  // Assassin's Creed - Build Theorycruncher (player 9000004)
  {
    id: 'gaming_006',
    customer_id: '9000004',
    player_name: 'BuildCrafter99',
    game: 'Assassins Creed',
    archetype: 'Build Theorycruncher',
    subject: 'Odyssey build reset after buying abilities pack',
    preview: "I purchased the new abilities pack for Odyssey and now my entire build is reset. I had spent hours optimizing my warrior/assassin hybrid build. Can this be restored?",
    priority: 'high',
    smart_score: 7.9,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
    channel: 'chat',
    spend: 149.99,
    playtime_hours: 267,
  },
  // Assassin's Creed - Casual Tourist (player 9000003)
  {
    id: 'gaming_007',
    customer_id: '9000003',
    player_name: 'WeekendExplorer',
    game: 'Assassins Creed',
    archetype: 'Casual Tourist',
    subject: 'How do I fast travel in Origins?',
    preview: "I'm really enjoying exploring ancient Egypt but walking everywhere takes forever. Is there a fast travel system I'm missing?",
    priority: 'low',
    smart_score: 3.2,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    channel: 'email',
    spend: 59.99,
    playtime_hours: 23,
  },
  // NBA 2K - Couch Co-op Social (player 9000007)
  {
    id: 'gaming_008',
    customer_id: '9000007',
    player_name: 'CoachPotatoGamer',
    game: 'NBA 2K',
    archetype: 'Couch Co-op Social',
    subject: 'Local multiplayer not working with 4 controllers',
    preview: "Trying to play with friends but the game only recognizes 2 controllers. We're trying to do couch co-op like we always do. Any help?",
    priority: 'low',
    smart_score: 4.1,
    created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8 hours ago
    channel: 'chat',
    spend: 59.99,
    playtime_hours: 42,
  },
  // NBA 2K - Another Competitive Whale
  {
    id: 'gaming_009',
    customer_id: '9000005',
    player_name: 'ProStriker23',
    game: 'NBA 2K',
    archetype: 'Competitive Whale',
    subject: 'Need refund on 450K VC - accidental purchase',
    preview: "I accidentally bought 450,000 VC instead of 45,000. Can I get a refund? I'm a regular spender but this was a mistake.",
    priority: 'urgent',
    smart_score: 8.7,
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
    channel: 'email',
    spend: 2847.50,
    playtime_hours: 847,
  },
];

function formatTimeAgo(date: string): string {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function GamingPage() {
  const navigate = useNavigate();
  const [gameFilter, setGameFilter] = useState<'all' | 'Assassins Creed' | 'NBA 2K'>('all');

  const filteredTickets = gameFilter === 'all'
    ? GAMING_TICKETS
    : GAMING_TICKETS.filter(t => t.game === gameFilter);

  const sortedTickets = [...filteredTickets].sort((a, b) => b.smart_score - a.smart_score);

  return (
    <div className="flex gap-4 p-4 max-w-7xl mx-auto">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">
            Gaming Support Inbox ({sortedTickets.length})
          </h1>
        </div>

        {/* Game Filter Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-6">
            <button
              onClick={() => setGameFilter('all')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                gameFilter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Games
            </button>
            <button
              onClick={() => setGameFilter('Assassins Creed')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                gameFilter === 'Assassins Creed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assassin's Creed
            </button>
            <button
              onClick={() => setGameFilter('NBA 2K')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                gameFilter === 'NBA 2K'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              NBA 2K
            </button>
          </nav>
        </div>

        {/* Ticket List */}
        <div className="space-y-2">
          {sortedTickets.map((ticket) => {
            const isHighPriority = ticket.smart_score >= 8;

            return (
              <div
                key={ticket.id}
                className={`p-4 rounded cursor-pointer transition-all duration-200 ${
                  isHighPriority
                    ? 'border border-transparent bg-white shadow-[0_0_15px_rgba(6,182,212,0.5),0_0_30px_rgba(6,182,212,0.3),0_0_45px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6),0_0_40px_rgba(6,182,212,0.4),0_0_60px_rgba(6,182,212,0.15)]'
                    : 'border border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{ticket.subject}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{ticket.player_name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{ticket.archetype}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className={`${isHighPriority ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        {ticket.smart_score.toFixed(1)}
                      </span>
                    </div>
                    {formatTimeAgo(ticket.created_at)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 truncate">{ticket.preview}</div>
                <div className="mt-2 flex gap-2 text-xs text-gray-500 items-center">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    ticket.game === 'NBA 2K' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {ticket.game}
                  </span>
                  <span>•</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    ticket.channel === 'chat' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ticket.channel.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{ticket.priority}</span>
                  <span>•</span>
                  <span>LTV: ${ticket.spend.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar - Player Intelligence */}
      <div className="w-80">
        <div className="sticky top-4">
          <h2 className="text-sm font-medium mb-3">Gaming Intelligence</h2>

          <div className="space-y-3">
            {/* High Priority Alert */}
            {sortedTickets.some(t => t.smart_score >= 8) && (
              <div className="p-4 border border-amber-300 bg-amber-50 rounded">
                <div className="text-xs font-medium text-amber-700 mb-2">HIGH PRIORITY PLAYERS</div>
                <div className="text-sm text-amber-800">
                  {sortedTickets.filter(t => t.smart_score >= 8).length} tickets from high-value or at-risk players require immediate attention.
                </div>
              </div>
            )}

            {/* Archetype Breakdown */}
            <div className="p-4 border border-gray-300 rounded">
              <div className="text-xs font-medium text-gray-500 mb-2">ARCHETYPE BREAKDOWN</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Competitive Whales</span>
                  <span className="font-medium">{sortedTickets.filter(t => t.archetype === 'Competitive Whale').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completionists</span>
                  <span className="font-medium">{sortedTickets.filter(t => t.archetype === 'Completionist Explorer').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collectors</span>
                  <span className="font-medium">{sortedTickets.filter(t => t.archetype === 'Dream Team Collector').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other</span>
                  <span className="font-medium">
                    {sortedTickets.filter(t =>
                      !['Competitive Whale', 'Completionist Explorer', 'Dream Team Collector'].includes(t.archetype)
                    ).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Spend Analysis */}
            <div className="p-4 border border-gray-300 rounded">
              <div className="text-xs font-medium text-gray-500 mb-2">SPEND ANALYSIS</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Player LTV</span>
                  <span className="font-medium">
                    ${sortedTickets.reduce((sum, t) => sum + t.spend, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Ticket LTV</span>
                  <span className="font-medium">
                    ${(sortedTickets.reduce((sum, t) => sum + t.spend, 0) / sortedTickets.length).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">High Value (>$500)</span>
                  <span className="font-medium text-amber-600">
                    {sortedTickets.filter(t => t.spend > 500).length} tickets
                  </span>
                </div>
              </div>
            </div>

            {/* What Quimbi Analyzes */}
            <div className="p-4 border border-blue-200 bg-blue-50 rounded">
              <div className="text-xs font-medium text-blue-700 mb-2">WHAT QUIMBI ANALYZES</div>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Player archetype (Whale, Completionist, Casual)</li>
                <li>• Total spend & purchase history</li>
                <li>• Playtime & engagement level</li>
                <li>• Issue urgency & retention risk</li>
                <li>• Game-specific context (DLC, VC, builds)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
