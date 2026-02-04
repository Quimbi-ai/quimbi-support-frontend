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
        // Only initialize with player message - AI response will be shown in editor
        const initialMessages: Message[] = [
          {
            id: '1',
            sender: 'player',
            text: ticket.fullMessage,
            timestamp: ticket.time,
          },
        ];
        setConversations(prev => ({ ...prev, [ticketId]: initialMessages }));

        // Show initial AI response in editor for demo user to edit before sending
        setAiResponseDraft(ticket.response);
        setShowAiEditor(true);

        return initialMessages;
      }
    }
    return conversations[ticketId] || [];
  };

  // Generate AI response based on context and conversation history
  const generateAIResponse = (playerMessage: string, ticket: any, conversationHistory: Message[]): string => {
    const lowerMessage = playerMessage.toLowerCase();

    // Get conversation context
    const lastAgentMessage = [...conversationHistory].reverse().find(m => m.sender === 'agent');
    const lastAgentText = lastAgentMessage?.text.toLowerCase() || '';
    const allPlayerMessages = conversationHistory.filter(m => m.sender === 'player').map(m => m.text.toLowerCase()).join(' ');

    // Detect if this is a connection/lag issue
    const isConnectionIssue = allPlayerMessages.includes('lag') || allPlayerMessages.includes('connection') ||
                              allPlayerMessages.includes('disconnect') || allPlayerMessages.includes('unstable');

    // Check if AI asked a question that needs answering
    const askedForDetails = lastAgentText.includes('tell me') || lastAgentText.includes('can you') ||
                           lastAgentText.includes('do you') || lastAgentText.includes('have you');
    const askedForDiagnostics = lastAgentText.includes('city') || lastAgentText.includes('provider') ||
                               lastAgentText.includes('isp') || lastAgentText.includes('location');

    // User is asking for solution/next steps
    if ((lowerMessage.includes('solution') || lowerMessage.includes('what') && lowerMessage.includes('do')) ||
        (lowerMessage.includes('ok') || lowerMessage.includes('okay')) && askedForDetails) {

      if (isConnectionIssue) {
        // Connection issue detected - provide diagnostic steps
        const mentionedEndOfMatch = allPlayerMessages.includes('end') && allPlayerMessages.includes('match');

        if (!askedForDiagnostics) {
          return `Thanks for that information${mentionedEndOfMatch ? ' - the fact that it happens at the end of matches is really helpful' : ''}. To help diagnose this connection issue, I need a bit more info:\n\n1. What city are you playing from?\n2. Who's your internet service provider (ISP)?\n3. Are you on WiFi or wired connection?\n\nThis will help me check if there are any known issues with routing to our servers from your area.`;
        } else {
          // Already asked for diagnostics, give them next steps
          return `Based on the connection pattern you're seeing, here's what I'd like you to try:\n\n1. Run a traceroute to our game servers - this will show where the connection is dropping\n2. Try switching from WiFi to wired (or vice versa) to see if that helps\n3. Restart your router/modem\n\nCan you also let me know what city you're in and your ISP? I want to check if there are any known routing issues affecting players in your area. In the meantime, I'm escalating this to restore your lost rating points.`;
        }
      }

      // For non-connection issues, provide specific solutions based on ticket type
      if (ticket.subject.toLowerCase().includes('trophy') || ticket.subject.toLowerCase().includes('achievement')) {
        return `I've checked our system and this trophy bug is affecting several players. Here's the solution:\n\nOur team has a patch deploying on Tuesday (Feb 6th) that will fix this. Once it's live:\n1. Load your save file\n2. The trophy should auto-unlock within 24 hours\n3. If it doesn't, message me back and I'll manually trigger it for your account\n\nI'm also adding a special mount to your inventory as thanks for your patience.`;
      }

      if (ticket.subject.toLowerCase().includes('card') || ticket.subject.toLowerCase().includes('pack')) {
        return `I've reviewed your account and confirmed the pack purchase. The guaranteed Kobe card didn't drop due to a sync issue. I'm adding it to your account right now - you should see it within 5 minutes. Try restarting the game if you don't see it immediately.\n\nI'm also adding 10,000 VC as an apology for the inconvenience.`;
      }

      if (ticket.subject.toLowerCase().includes('stealth') || ticket.subject.toLowerCase().includes('detect')) {
        return `This is definitely a bug from yesterday's patch - enemies shouldn't be detecting through walls. Our team identified the issue and a hotfix is deploying within the next 6 hours. The fix will restore proper line-of-sight detection.\n\nNo need for a refund - we're making this right. I'll follow up once the hotfix is live.`;
      }
    }

    // User provided diagnostic info (mentions city, ISP, or location details)
    if ((lowerMessage.includes('from') || lowerMessage.includes('isp') || lowerMessage.includes('provider') ||
         lowerMessage.includes('wifi') || lowerMessage.includes('wired')) && askedForDiagnostics) {
      return `Thanks for that info! Let me check our server routing for your area...\n\nI'm seeing some reports of intermittent routing issues with certain ISPs in that region. Here's what I recommend:\n\n1. Try using a wired connection if you're on WiFi (reduces packet loss)\n2. Restart your router/modem\n3. If possible, try connecting during off-peak hours (10am-4pm local time)\n\nI'm also restoring your 50 rating points right now and adding 100,000 VC as compensation for the frustration. You should see both within the next hour. I've escalated the routing issue to our network team for investigation.`;
    }

    // Handle thank you
    if (lowerMessage.includes('thank') || lowerMessage.includes('appreciate')) {
      return ticket.spend > 500
        ? `You're very welcome, ${ticket.player}! As one of our top players, your satisfaction is our priority. Is there anything else I can help you with today?`
        : `You're welcome! I'm glad I could help. Feel free to reach out if you need anything else. Happy gaming!`;
    }

    // User is providing more details about the issue
    if (askedForDetails && !lowerMessage.includes('solution') && !lowerMessage.includes('ok')) {
      return `That's really helpful context - ${lowerMessage.includes('end') ? 'the timing at the end of matches suggests it might be a server load issue during score calculation' : 'this information helps me narrow down what might be causing the problem'}. Let me gather a bit more information so I can provide you with the best solution. What city are you playing from, and who's your internet service provider?`;
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
