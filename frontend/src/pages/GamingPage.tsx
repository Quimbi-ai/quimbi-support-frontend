import { useState } from 'react';

export function GamingPage() {
  const [gameFilter, setGameFilter] = useState<'all' | 'ac' | 'nba'>('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  // Hardcoded fake tickets - NO API CALLS
  const tickets = [
    {
      id: '1',
      game: 'NBA 2K',
      player: 'ProStriker23',
      archetype: 'Competitive Whale',
      subject: 'Ranked matchmaking broken - lost rating unfairly',
      message: "I just lost 50 rating points due to server lag. I've spent $2800+ on this game. This is unacceptable.",
      fullMessage: "I just lost 50 rating points because of server lag in a ranked match. This has happened 3 times this week. I've spent over $2800 on this game and I expect better servers. I need my rating restored immediately or I'm switching to a different game. This is completely unacceptable for a premium player like me.",
      priority: 9.5,
      spend: 2847.50,
      playtime: 847,
      time: '15m ago',
      response: "Hi ProStriker23,\n\nI completely understand your frustration. As one of our most valued players with 847 hours invested, this experience falls short of what you deserve.\n\nI'm escalating this to our server team immediately and I'll personally ensure your rating is restored within the next 2 hours. I'm also adding 100,000 VC to your account as an apology for this disruption.\n\nWe're aware of the server issues during peak hours and our team is working on a permanent fix. You should see improvements by this weekend.\n\nThank you for your patience and loyalty to NBA 2K.",
    },
    {
      id: '2',
      game: 'Assassins Creed',
      player: 'AchievementHunter',
      archetype: 'Completionist Explorer',
      subject: 'Valhalla DLC trophy glitched - blocking 100%',
      message: "The Wrath of the Druids DLC trophy won't unlock. I'm at 99.8% completion.",
      fullMessage: "The Wrath of the Druids DLC has a bugged trophy that won't unlock even though I've completed all requirements. I'm at 99.8% completion and this is the only thing stopping me from getting platinum. I've bought every DLC day one to support you guys, so this is really disappointing.",
      priority: 8.2,
      spend: 189.99,
      playtime: 312,
      time: '45m ago',
      response: "Hello AchievementHunter,\n\nThank you for your dedication to achieving 100% completion - that's impressive! I can see you've completed all the requirements for the trophy.\n\nThis is a known issue affecting completionists in the Druids DLC. Our team has developed a fix that will be included in next week's patch (Tuesday, Feb 6th).\n\nOnce the patch is live, the trophy should unlock automatically when you load your save. If it doesn't unlock within 24 hours of the patch, please reach out and I'll manually trigger it for your account.\n\nAs a thank you for your patience and day-one DLC support, I'm adding a special in-game mount to your inventory.\n\nHappy hunting, Assassin!",
    },
    {
      id: '3',
      game: 'NBA 2K',
      player: 'LakersForever',
      archetype: 'Dream Team Collector',
      subject: 'Missing Kobe Bryant card from pack',
      message: "Opened the Lakers pack but didn't get the guaranteed Kobe card.",
      fullMessage: "I just opened the all-time Lakers pack and didn't get the guaranteed Kobe Bryant card. This was the whole reason I bought the pack - to complete my Lakers collection. Can you please check my account and add the card? I have the receipt showing I purchased the pack.",
      priority: 7.1,
      spend: 487.25,
      playtime: 156,
      time: '2h ago',
      response: "Hi LakersForever,\n\nI checked your account and I can see you did purchase the Lakers Historic pack 2 hours ago. I understand how important completing your Lakers collection is.\n\nI've reviewed the pack opening and it appears there was a sync issue with the guaranteed card. I'm adding the Kobe Bryant (99 OVR) card to your collection right now.\n\nYou should see it in your lineup within the next 5 minutes. If you don't see it, try restarting the game.\n\nThank you for building your dream team with us! Go Lakers!",
    },
    {
      id: '4',
      game: 'Assassins Creed',
      player: 'ShadowBlade',
      archetype: 'Stealth Purist',
      subject: 'Stealth mechanics changed after patch',
      message: "Enemies detect me through walls after the update. This ruins the stealth gameplay.",
      fullMessage: "Since the last update, enemies seem to detect me through walls. The stealth gameplay that made me buy Mirage specifically is completely broken now. I can't complete missions using stealth anymore. Was this intentional or is it a bug? If it's intentional, I want a refund because this isn't the game I paid for.",
      priority: 6.3,
      spend: 89.99,
      playtime: 89,
      time: '3h ago',
      response: "Hi ShadowBlade,\n\nThank you for bringing this to our attention. This is definitely not intentional - stealth is core to the Assassin's Creed experience, especially in Mirage.\n\nWe identified an AI detection bug introduced in yesterday's patch that affects line-of-sight calculations. A hotfix is being deployed within the next 6 hours that will restore the intended stealth mechanics.\n\nI apologize for the disruption to your gameplay. As a stealth specialist, you deserve the authentic assassin experience you purchased.\n\nThe fix will restore the proper detection ranges and wall-blocking. No refund necessary - we're making this right.\n\nStay hidden, Assassin.",
    },
  ];

  const filtered = gameFilter === 'all'
    ? tickets
    : tickets.filter(t =>
        gameFilter === 'ac' ? t.game === 'Assassins Creed' : t.game === 'NBA 2K'
      );

  const sorted = [...filtered].sort((a, b) => b.priority - a.priority);
  const selected = tickets.find(t => t.id === selectedTicket);

  if (selected) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedTicket(null)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Gaming Inbox
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold mb-2">{selected.subject}</h1>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>{selected.player}</span>
                  <span>•</span>
                  <span>{selected.archetype}</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded ${
                    selected.game === 'NBA 2K' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {selected.game}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-600">Priority: {selected.priority.toFixed(1)}</div>
                <div className="text-xs text-gray-500">{selected.time}</div>
              </div>
            </div>
          </div>

          {/* Player Intelligence */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <div className="text-xs font-medium text-blue-700 mb-2">PLAYER INTELLIGENCE</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Spend</div>
                <div className="font-medium">${selected.spend.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Playtime</div>
                <div className="font-medium">{selected.playtime} hours</div>
              </div>
              <div>
                <div className="text-gray-600">Archetype</div>
                <div className="font-medium">{selected.archetype}</div>
              </div>
            </div>
          </div>

          {/* Customer Message */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500 mb-2">PLAYER MESSAGE</div>
            <div className="bg-gray-50 rounded p-4 text-sm whitespace-pre-wrap">
              {selected.fullMessage}
            </div>
          </div>

          {/* AI Response */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">QUIMBI AI RESPONSE</div>
            <div className="bg-green-50 border border-green-200 rounded p-4 text-sm whitespace-pre-wrap">
              {selected.response}
            </div>
          </div>

          {/* What Quimbi Analyzed */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
            <div className="text-xs font-medium text-amber-700 mb-2">WHAT QUIMBI ANALYZED</div>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>✓ Player archetype: {selected.archetype}</li>
              <li>✓ Total spend (${selected.spend.toLocaleString()}) indicates {selected.spend > 500 ? 'high-value player' : 'standard player'}</li>
              <li>✓ Issue urgency: {selected.priority >= 8 ? 'High priority - retention risk' : 'Standard priority'}</li>
              <li>✓ Game-specific context: {selected.game} player expectations</li>
              <li>✓ Response tone: {selected.priority >= 8 ? 'Apologetic with immediate action' : 'Helpful and informative'}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

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
            onClick={() => setSelectedTicket(ticket.id)}
            className={`p-4 border rounded cursor-pointer transition-all duration-200 ${
              ticket.priority >= 8
                ? 'border-amber-400 bg-amber-50 shadow-lg hover:shadow-xl'
                : 'border-gray-200 hover:border-gray-400'
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
              <span className={`px-2 py-1 rounded ${
                ticket.game === 'NBA 2K' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {ticket.game}
              </span>
              <span>LTV: ${ticket.spend.toLocaleString()}</span>
              <span>→ Click to view AI response</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
