import { useState } from 'react';

export function GamingPage() {
  const [gameFilter, setGameFilter] = useState<'all' | 'ac' | 'nba'>('all');

  // Hardcoded fake tickets - NO API CALLS
  const tickets = [
    {
      id: '1',
      game: 'NBA 2K',
      player: 'ProStriker23',
      archetype: 'Competitive Whale',
      subject: 'Ranked matchmaking broken - lost rating unfairly',
      message: "I just lost 50 rating points due to server lag. I've spent $2800+ on this game. This is unacceptable.",
      priority: 9.5,
      spend: 2847.50,
      time: '15m ago',
    },
    {
      id: '2',
      game: 'Assassins Creed',
      player: 'AchievementHunter',
      archetype: 'Completionist Explorer',
      subject: 'Valhalla DLC trophy glitched - blocking 100%',
      message: "The Wrath of the Druids DLC trophy won't unlock. I'm at 99.8% completion.",
      priority: 8.2,
      spend: 189.99,
      time: '45m ago',
    },
    {
      id: '3',
      game: 'NBA 2K',
      player: 'LakersForever',
      archetype: 'Dream Team Collector',
      subject: 'Missing Kobe Bryant card from pack',
      message: "Opened the Lakers pack but didn't get the guaranteed Kobe card.",
      priority: 7.1,
      spend: 487.25,
      time: '2h ago',
    },
    {
      id: '4',
      game: 'Assassins Creed',
      player: 'ShadowBlade',
      archetype: 'Stealth Purist',
      subject: 'Stealth mechanics changed after patch',
      message: "Enemies detect me through walls after the update. This ruins the stealth gameplay.",
      priority: 6.3,
      spend: 89.99,
      time: '3h ago',
    },
  ];

  const filtered = gameFilter === 'all'
    ? tickets
    : tickets.filter(t =>
        gameFilter === 'ac' ? t.game === 'Assassins Creed' : t.game === 'NBA 2K'
      );

  const sorted = [...filtered].sort((a, b) => b.priority - a.priority);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Gaming Support Inbox ({sorted.length})</h1>

      {/* Game Filters */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setGameFilter('all')}
          className={`px-4 py-2 rounded ${
            gameFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          All Games
        </button>
        <button
          onClick={() => setGameFilter('ac')}
          className={`px-4 py-2 rounded ${
            gameFilter === 'ac' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Assassin's Creed
        </button>
        <button
          onClick={() => setGameFilter('nba')}
          className={`px-4 py-2 rounded ${
            gameFilter === 'nba' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          NBA 2K
        </button>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {sorted.map((ticket) => (
          <div
            key={ticket.id}
            className={`p-4 border rounded ${
              ticket.priority >= 8
                ? 'border-amber-400 bg-amber-50 shadow-lg'
                : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">{ticket.subject}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {ticket.player} • {ticket.archetype}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-600">
                  {ticket.priority.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">{ticket.time}</div>
              </div>
            </div>
            <div className="text-sm text-gray-700">{ticket.message}</div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-blue-100 rounded">{ticket.game}</span>
              <span>LTV: ${ticket.spend.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
