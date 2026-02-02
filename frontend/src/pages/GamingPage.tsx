import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  sender: 'player' | 'agent';
  text: string;
  timestamp: string;
}

export function GamingPage() {
  const [gameFilter, setGameFilter] = useState<'all' | 'ac' | 'nba'>('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiResponseDraft, setAiResponseDraft] = useState('');
  const [showAiEditor, setShowAiEditor] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('selectedTicket state changed:', selectedTicket);
  }, [selectedTicket]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedTicket]);

  // Initialize conversation when ticket is selected
  const getConversation = (ticketId: string) => {
    if (!conversations[ticketId]) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        const initialMessages: Message[] = [
          {
            id: '1',
            sender: 'player',
            text: ticket.fullMessage,
            timestamp: ticket.time,
          },
          {
            id: '2',
            sender: 'agent',
            text: ticket.response,
            timestamp: 'Just now',
          },
        ];
        setConversations(prev => ({ ...prev, [ticketId]: initialMessages }));
        return initialMessages;
      }
    }
    return conversations[ticketId] || [];
  };

  // Generate AI response based on context and conversation history
  const generateAIResponse = (playerMessage: string, ticket: any, conversationHistory: Message[]): string => {
    const lowerMessage = playerMessage.toLowerCase();

    // Get the last AI message to understand context
    const lastAgentMessage = [...conversationHistory].reverse().find(m => m.sender === 'agent');
    const lastAgentText = lastAgentMessage?.text.toLowerCase() || '';

    // Check if we just promised something specific (rating restoration, compensation, etc.)
    const promisedRatingRestore = lastAgentText.includes('rating') && lastAgentText.includes('restore');
    const promisedCompensation = lastAgentText.includes('vc') || lastAgentText.includes('compensation') || lastAgentText.includes('adding');
    const promisedFix = lastAgentText.includes('fix') || lastAgentText.includes('patch') || lastAgentText.includes('hotfix');
    const mentionedTimeframe = lastAgentText.match(/(\d+)\s*(hour|day|minute)/i);

    // Handle follow-up questions about timing/confirmation
    if ((lowerMessage.includes('how long') || lowerMessage.includes('when') || lowerMessage.includes('confirm')) &&
        (promisedRatingRestore || promisedCompensation || promisedFix)) {

      if (ticket.spend > 500) {
        if (promisedRatingRestore) {
          return `You should see your rating restored within the next 2 hours. You'll receive an in-game notification once it's complete. If you don't see it by then, message me back and I'll check the status immediately.`;
        }
        if (promisedCompensation) {
          return `The VC compensation will be added to your account within 30 minutes. You should see it the next time you restart the game. The system will also send you a confirmation message.`;
        }
        if (promisedFix && mentionedTimeframe) {
          return `The fix should be deployed within ${mentionedTimeframe[0]}. You can check the game's update section or our status page for confirmation. I'll also follow up with you once it's live.`;
        }
      } else {
        if (promisedFix) {
          return `The patch is scheduled to go live within 24-48 hours. You'll see an update notification in the game when it's ready to download. Feel free to check back here if you need an update before then.`;
        }
      }
    }

    // Handle complaints/frustration after promises were made
    if ((lowerMessage.includes('not') || lowerMessage.includes('didn\'t') || lowerMessage.includes('wasn\'t')) &&
        (lowerMessage.includes('question') || lowerMessage.includes('answer'))) {
      return `I apologize for the confusion. Let me address your specific question directly. Could you please clarify what you'd like to know? I want to make sure I give you the exact information you need.`;
    }

    // High-value player responses (Competitive Whale, Dream Team Collector)
    if (ticket.spend > 500) {
      if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
        return `You're very welcome, ${ticket.player}! As one of our top players, your satisfaction is our priority. Is there anything else I can help you with today?`;
      }
      if (lowerMessage.includes('when') || lowerMessage.includes('how long')) {
        return `I'm checking on this right now. Given your player status, I'm prioritizing this and you should see the resolution within the next hour. I'll send you a confirmation as soon as it's complete.`;
      }
      if (lowerMessage.includes('still') || lowerMessage.includes('not working') || lowerMessage.includes('broken')) {
        return `I sincerely apologize that you're still experiencing this issue. Let me escalate this immediately to our senior team. I'm also adding additional compensation to your account for the continued inconvenience. You'll receive an update within 30 minutes.`;
      }
      return `I completely understand your concern, ${ticket.player}. As a valued member of our community, I want to make sure this is resolved to your satisfaction. Let me look into this further and get back to you with a comprehensive solution.`;
    }

    // Standard player responses (Completionist, Stealth Purist)
    if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
      return `You're welcome! I'm glad I could help. Feel free to reach out if you need anything else. Happy gaming!`;
    }
    if (lowerMessage.includes('when') || lowerMessage.includes('how long')) {
      return `Based on our current timeline, you should see this resolved within 24-48 hours. I'll make sure to follow up with you once the fix is deployed.`;
    }
    if (lowerMessage.includes('still') || lowerMessage.includes('not working') || lowerMessage.includes('broken')) {
      return `I'm sorry to hear it's still not working. Let me check the status of the fix and get back to you with an update. Can you let me know exactly what you're experiencing?`;
    }

    // Default helpful response
    return `Thanks for the additional information. I'm reviewing your account details and will make sure this gets the attention it deserves. Is there anything specific you'd like me to prioritize?`;
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedTicket) return;

    const ticket = tickets.find(t => t.id === selectedTicket);
    if (!ticket) return;

    const currentConversation = conversations[selectedTicket] || getConversation(selectedTicket);

    // Add player message
    const playerMessage: Message = {
      id: Date.now().toString(),
      sender: 'player',
      text: inputValue.trim(),
      timestamp: 'Just now',
    };

    const playerMessageText = inputValue.trim();
    setInputValue('');

    setConversations(prev => ({
      ...prev,
      [selectedTicket]: [...currentConversation, playerMessage],
    }));

    setIsTyping(true);

    // Simulate AI typing delay, then show editable draft
    setTimeout(() => {
      const updatedConversation = [...currentConversation, playerMessage];
      const generatedResponse = generateAIResponse(playerMessageText, ticket, updatedConversation);

      setAiResponseDraft(generatedResponse);
      setShowAiEditor(true);
      setIsTyping(false);
    }, 1500);
  };

  // Handle sending the AI response after editing
  const handleSendAiResponse = () => {
    if (!aiResponseDraft.trim() || !selectedTicket) return;

    const aiMessage: Message = {
      id: Date.now().toString(),
      sender: 'agent',
      text: aiResponseDraft.trim(),
      timestamp: 'Just now',
    };

    setConversations(prev => ({
      ...prev,
      [selectedTicket]: [...(prev[selectedTicket] || []), aiMessage],
    }));

    setAiResponseDraft('');
    setShowAiEditor(false);
  };

  // Reset conversation to initial state
  const handleResetConversation = () => {
    if (!selectedTicket) return;

    // Remove the conversation from state, forcing re-initialization
    setConversations(prev => {
      const newConversations = { ...prev };
      delete newConversations[selectedTicket];
      return newConversations;
    });

    setInputValue('');
  };

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
      response: "Hi ProStriker23, thanks for reaching out. I'm really sorry to hear about your experience with the server lag - that sounds incredibly frustrating, especially during ranked matches.\n\nI can see you've been with us for quite a while and have invested a lot of time in the game. Can you tell me a bit more about when this happened? Was it during a specific time of day, or have you noticed any patterns with the lag?",
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
      response: "Hi AchievementHunter, I can see from your account that you're so close to that platinum - 99.8% is seriously impressive!\n\nI want to help you get this sorted out. Can you let me know which specific trophy isn't unlocking? Also, have you tried any troubleshooting steps on your end, like reloading the save or checking the requirements list?",
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
      response: "Hey LakersForever! I can see you're building up that Lakers collection - nice!\n\nLet me take a look at your account real quick to see what happened with that pack. Do you happen to remember if you got any error messages when you opened it, or did it just not show the Kobe card in the reveal?",
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
      response: "Hi ShadowBlade, thanks for reporting this. That definitely sounds frustrating - stealth is the core of Mirage, so I totally understand why this would be a problem.\n\nCan you tell me more about where this is happening? Is it in specific missions or areas, or are you seeing it throughout the game? Also, have you noticed if it's consistent or just happens sometimes?",
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

          {/* Chat Window */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500 mb-2">CONVERSATION</div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {getConversation(selected.id).map((message) => (
                message.sender === 'player' ? (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {selected.player[0]}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{selected.player}</span>
                        <span className="text-xs text-gray-400">{message.timestamp}</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 text-sm whitespace-pre-wrap">
                        {message.text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-xs text-gray-400">{message.timestamp}</span>
                        <span className="text-xs font-medium text-gray-700">Quimbi AI Agent</span>
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          Q
                        </div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg rounded-tr-none p-3 text-sm whitespace-pre-wrap">
                        {message.text}
                      </div>
                    </div>
                  </div>
                )
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <span className="text-xs font-medium text-gray-700">Quimbi AI Agent</span>
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                        Q
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg rounded-tr-none p-3 text-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* AI Response Editor */}
            {showAiEditor && (
              <div className="mt-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="text-xs font-medium text-green-700 mb-2">AI DRAFT RESPONSE (EDIT BEFORE SENDING)</div>
                <textarea
                  value={aiResponseDraft}
                  onChange={(e) => setAiResponseDraft(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  rows={6}
                  placeholder="Edit the AI's response..."
                />
                <div className="mt-2 flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAiEditor(false);
                      setAiResponseDraft('');
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendAiResponse}
                    disabled={!aiResponseDraft.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Send AI Response
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Type a message as the player..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !showAiEditor && handleSendMessage()}
                disabled={showAiEditor}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleResetConversation}
                disabled={showAiEditor}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Reset conversation to beginning"
              >
                Reset
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping || showAiEditor}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
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
            onClick={() => {
              console.log('Ticket clicked:', ticket.id, ticket.subject);
              setSelectedTicket(ticket.id);
            }}
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
