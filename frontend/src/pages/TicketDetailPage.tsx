import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../api/tickets';
import { aiApi } from '../api/ai';

export function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketApi.getById(ticketId!),
    enabled: !!ticketId,
  });

  // Fetch AI-generated draft response
  const { data: draftData, isLoading: isDraftLoading, error: draftError } = useQuery({
    queryKey: ['draft', ticketId],
    queryFn: () => aiApi.getDraftResponse(ticketId!),
    enabled: !!ticketId,
    retry: false, // Don't retry - show error immediately
  });

  // Close ticket mutation
  const closeTicket = useMutation({
    mutationFn: async () => {
      return ticketApi.update(ticketId!, { status: 'closed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // Send response mutation
  const sendResponse = useMutation({
    mutationFn: async (content: string) => {
      return ticketApi.sendMessage(ticketId!, {
        content,
        from_agent: true,
        author_name: 'Agent',
      });
    },
    onSuccess: () => {
      setResponse('');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['draft', ticketId] });
    },
  });

  // Add internal note mutation
  const addNote = useMutation({
    mutationFn: async (content: string) => {
      return ticketApi.addNote(ticketId!, {
        content,
        author_name: 'Agent',
        author_id: 'agent-1',
      });
    },
    onSuccess: () => {
      setInternalNote('');
      setShowNoteInput(false);
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  // Regenerate draft mutation
  const regenerateDraft = useMutation({
    mutationFn: async (tone?: string) => {
      return aiApi.regenerateDraft(ticketId!, { tone: tone as 'friendly' | 'professional' | 'empathetic' | 'apologetic' });
    },
    onSuccess: (data) => {
      setResponse(data.draft);
      queryClient.invalidateQueries({ queryKey: ['draft', ticketId] });
    },
  });

  // Helper: Split message on sentence boundaries
  const splitMessageOnSentences = (text: string, maxLen: number): string[] => {
    if (text.length <= maxLen) return [text];

    const messages: string[] = [];
    // Split on sentence boundaries (., !, ?)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentMessage = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      // If single sentence is too long, split on comma or space
      if (trimmedSentence.length > maxLen) {
        if (currentMessage) {
          messages.push(currentMessage.trim());
          currentMessage = '';
        }

        // Split long sentence on commas first
        const parts = trimmedSentence.split(/,\s+/);
        for (const part of parts) {
          if (part.length > maxLen) {
            // Last resort: split on word boundaries
            const words = part.split(' ');
            let chunk = '';
            for (const word of words) {
              if ((chunk + ' ' + word).length > maxLen) {
                if (chunk) messages.push(chunk.trim());
                chunk = word;
              } else {
                chunk = chunk ? chunk + ' ' + word : word;
              }
            }
            if (chunk) messages.push(chunk.trim());
          } else if ((currentMessage + ' ' + part).length > maxLen) {
            if (currentMessage) messages.push(currentMessage.trim());
            currentMessage = part;
          } else {
            currentMessage = currentMessage ? currentMessage + ', ' + part : part;
          }
        }
      } else if ((currentMessage + ' ' + trimmedSentence).length > maxLen) {
        if (currentMessage) messages.push(currentMessage.trim());
        currentMessage = trimmedSentence;
      } else {
        currentMessage = currentMessage ? currentMessage + ' ' + trimmedSentence : trimmedSentence;
      }
    }

    if (currentMessage) messages.push(currentMessage.trim());
    return messages;
  };

  // Reset ticket mutation - deletes all messages except first and regenerates AI response
  const resetTicket = useMutation({
    mutationFn: async () => {
      if (!ticket?.messages || ticket.messages.length <= 1) return null;

      // Delete all messages except the first one
      await ticketApi.resetConversation(ticketId!);

      // Regenerate the AI draft response
      await aiApi.regenerateDraft(ticketId!, { tone: 'friendly' });

      return ticketId;
    },
    onSuccess: () => {
      // Refresh the ticket to show only the first message and new draft
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['draft', ticketId] });
    },
  });

  // Demo chat: Send customer message and get AI response
  const sendDemoMessage = useMutation({
    mutationFn: async (content: string) => {
      // Send customer message
      await ticketApi.sendMessage(ticketId!, {
        content,
        from_agent: false,
        author_name: ticket?.messages?.find(m => !m.from_agent)?.author_name || 'Customer',
      });

      // Wait a moment, then regenerate AI draft
      await new Promise(resolve => setTimeout(resolve, 500));
      return aiApi.regenerateDraft(ticketId!, { tone: 'friendly' });
    },
    onSuccess: async (aiResponse) => {
      setDemoMessage('');
      setIsAiResponding(true);

      // Simulate AI typing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get character limit based on channel
      const maxLen = ticket?.channel === 'sms' ? 160 : 400;
      const aiMessages = splitMessageOnSentences(aiResponse.draft, maxLen);

      // Send each message chunk with slight delays
      for (let i = 0; i < aiMessages.length; i++) {
        if (i > 0) {
          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        await ticketApi.sendMessage(ticketId!, {
          content: aiMessages[i],
          from_agent: true,
          author_name: 'Quimbi AI',
        });
      }

      setIsAiResponding(false);
      // Use refetch instead of invalidate to avoid losing UI state
      await queryClient.refetchQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['draft', ticketId] });
    },
  });

  // Update response when draft is loaded
  useEffect(() => {
    if (draftData?.draft) {
      setResponse(draftData.draft);
    }
  }, [draftData]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-gray-600">Loading ticket...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={() => navigate('/inbox')}
          className="text-sm text-gray-600 mb-4 hover:text-gray-900"
        >
          ← Back to inbox
        </button>
        <div className="text-red-600">
          Error loading ticket: {error?.message || 'Ticket not found'}
        </div>
      </div>
    );
  }

  // Helper to get archetype recommendation based on dominant segments
  const getArchetypeRecommendation = () => {
    const profile = ticket.customer_profile;
    if (!profile) return null;

    const segments = profile.dominant_segments || {};
    const tips: string[] = [];
    const metrics = profile.business_metrics;
    const churnScore = profile.churn_risk?.churn_risk_score || 0;

    // CRITICAL: Churn risk actions (highest priority)
    if (churnScore > 0.7) {
      tips.push('🚨 HIGH CHURN RISK - Offer 15-20% discount or loyalty reward to retain');
      tips.push('💨 Consider expedited shipping at no charge');
      tips.push('📞 Escalate to manager for personal touch if needed');
    } else if (churnScore > 0.4) {
      tips.push('⚠️ Moderate churn risk - Offer 10% discount or free shipping');
    }

    // Value-based actions
    if (segments.purchase_value === 'whale' || segments.purchase_value === 'premium') {
      tips.push('👑 VIP Customer - White-glove service, premium solutions only');
      tips.push('🎁 Can offer up to 20% discount + free expedited shipping');
    } else if (segments.purchase_value === 'mid_tier') {
      tips.push('💎 Solid customer - Good for 10-15% discount if needed');
    }

    // Price sensitivity actions
    if (segments.price_sensitivity === 'deal_hunter') {
      tips.push('💰 Price-sensitive - Lead with discounts (10-15% works well)');
      tips.push('📧 Mention current sales/promotions prominently');
    } else if (segments.price_sensitivity === 'strategic') {
      tips.push('🎯 Strategic buyer - Emphasize value, bundle opportunities');
    } else if (segments.price_sensitivity === 'full_price') {
      tips.push('⭐ Not price-sensitive - Focus on quality, convenience, speed');
    }

    // Frequency & timing actions
    if (segments.purchase_frequency === 'power_buyer') {
      tips.push('⚡ Frequent buyer - Be efficient, they know your products');
      tips.push('📦 May want faster shipping - offer expedited at discount');
    } else if (segments.purchase_frequency === 'occasional') {
      tips.push('🔄 Occasional buyer - This interaction is key to re-engagement');
      tips.push('💝 Small discount (10%) could trigger next purchase');
    } else if (segments.purchase_frequency === 'regular') {
      tips.push('📅 Regular customer - Maintain cadence, ensure satisfaction');
    }

    // Shopping cadence actions
    if (segments.shopping_cadence === 'weekend_crafter') {
      tips.push('🎨 Weekend crafter - They plan projects, may need items quickly');
    } else if (segments.shopping_cadence === 'seasonal') {
      tips.push('🌸 Seasonal buyer - Time-sensitive, may need expedited shipping');
    } else if (segments.shopping_cadence === 'weekday') {
      tips.push('📊 Weekday shopper - Likely planning ahead, values reliability');
    }

    // Return behavior
    if (segments.return_behavior === 'frequent_returner') {
      tips.push('↩️ Returns items often - Be extra clear about product details');
    } else if (segments.return_behavior === 'careful_buyer') {
      tips.push('✅ Rarely returns - Trust their judgment, they research well');
    }

    // Category affinity
    if (segments.category_affinity === 'multi_category') {
      tips.push('🛍️ Shops multiple categories - Great for cross-sell suggestions');
    } else if (segments.category_affinity === 'category_loyal') {
      tips.push('🎯 Category loyal - Recommend within their preferred category');
    }

    // Shopping maturity
    if (segments.shopping_maturity === 'long_term') {
      tips.push('🏆 Long-term customer - They know your brand, speak as partners');
    } else if (segments.shopping_maturity === 'developing') {
      tips.push('🌱 Developing relationship - Build trust, educate on products');
    } else if (segments.shopping_maturity === 'established') {
      tips.push('🤝 Established customer - Balance efficiency with personalization');
    }

    // Customer lifecycle stage based on orders, recency, and tenure
    if (metrics) {
      const daysSinceLastPurchase = metrics.days_since_last_purchase || 0;
      const totalOrders = metrics.total_orders || 0;
      const customerSinceDays = metrics.customer_tenure_days || 0;

      // Lapsed/Dormant customer (hasn't purchased in 180+ days but has order history)
      if (daysSinceLastPurchase > 180 && totalOrders > 0) {
        tips.push('😴 LAPSED CUSTOMER - Haven\'t purchased in ' + Math.floor(daysSinceLastPurchase / 30) + '+ months');
        tips.push('🎁 Win-back opportunity: 15-20% discount to re-engage');
        tips.push('💬 Ask what changed - product feedback can reveal issues');
      }
      // At-risk (90-180 days since purchase)
      else if (daysSinceLastPurchase > 90 && totalOrders > 0) {
        tips.push('⏰ At-risk of lapsing - Last purchase ' + Math.floor(daysSinceLastPurchase / 30) + ' months ago');
        tips.push('🎯 Re-engagement critical: 10-15% discount + highlight new products');
      }
      // True new customer (1-2 orders AND customer for less than 60 days)
      else if (totalOrders <= 2 && customerSinceDays < 60) {
        tips.push('🆕 New customer - First impression critical, over-deliver');
        tips.push('🎁 Consider 10% welcome discount if issue occurs');
      }
      // Early stage (2-5 orders, still developing relationship)
      else if (totalOrders >= 2 && totalOrders <= 5) {
        tips.push('🌱 Early-stage customer - Build trust and demonstrate value');
        tips.push('📚 Educational approach - explain products thoroughly');
      }
    }

    return tips.length > 0 ? tips : ['Standard support approach - be helpful and professional'];
  };

  const profile = ticket.customer_profile;
  const metrics = profile?.business_metrics;
  const churnScore = profile?.churn_risk?.churn_risk_score || 0;
  const recommendations = getArchetypeRecommendation();

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/inbox')}
        className="text-sm text-gray-600 mb-4 hover:text-gray-900"
      >
        ← Back to inbox
      </button>

      <div className="flex gap-4">
        {/* Main Content - Left Side */}
        <div className="flex-1">
          {/* Ticket header */}
          <div className="mb-4">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                ticket.channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                ticket.channel === 'chat' ? 'bg-green-100 text-green-700' :
                ticket.channel === 'phone' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {ticket.channel.toUpperCase()}
              </span>
              <span>•</span>
              <span>{ticket.priority}</span>
            </div>
          </div>

          {/* Messages */}
          {ticket.channel === 'sms' || ticket.channel === 'chat' ? (
            /* Conversational bubble view for SMS and Chat */
            <div className="mb-4 space-y-3 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded">
              {ticket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from_agent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl ${
                      msg.from_agent
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 rounded-bl-sm'
                    }`}
                  >
                    <div className={`text-xs mb-1 ${
                      msg.from_agent ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.author_name || 'Unknown'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Linear view for email and other channels */
            <div className="mb-4 space-y-3">
              {ticket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded ${
                    msg.from_agent ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-1">
                    {msg.author_name || 'Unknown'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
            </div>
          )}

          {/* Demo Chat Input - Only for Chat/SMS */}
          {(ticket.channel === 'chat' || ticket.channel === 'sms') && ticket.status !== 'closed' && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-700">🎮 DEMO MODE</span>
                  <span className="text-xs text-gray-600">Act as the customer and chat with AI</span>
                </div>
                {ticket.messages && ticket.messages.length > 1 && (
                  <button
                    onClick={() => resetTicket.mutate()}
                    disabled={resetTicket.isPending}
                    className="text-xs px-2 py-1 bg-white border border-purple-300 rounded hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetTicket.isPending ? 'Resetting...' : '↺ Reset Ticket'}
                  </button>
                )}
              </div>

              {isAiResponding && (
                <div className="mb-3 flex items-center gap-2 text-sm text-purple-600">
                  <div className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                  </div>
                  <span>AI is typing...</span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !sendDemoMessage.isPending && !isAiResponding && demoMessage.trim()) {
                      sendDemoMessage.mutate(demoMessage);
                    }
                  }}
                  placeholder={`Type as ${ticket.messages?.find(m => !m.from_agent)?.author_name || 'customer'}...`}
                  maxLength={ticket.channel === 'sms' ? 160 : 400}
                  disabled={sendDemoMessage.isPending || isAiResponding}
                  className="flex-1 px-3 py-2 border border-purple-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => sendDemoMessage.mutate(demoMessage)}
                  disabled={sendDemoMessage.isPending || isAiResponding || !demoMessage.trim()}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendDemoMessage.isPending ? 'Sending...' : isAiResponding ? 'AI responding...' : 'Send & Get AI Reply'}
                </button>
              </div>

              {ticket.channel === 'sms' && (
                <div className="mt-2 text-xs text-gray-500">
                  {demoMessage.length}/160 characters {demoMessage.length > 140 && '⚠️ Approaching SMS limit'}
                </div>
              )}
              {ticket.channel === 'chat' && (
                <div className="mt-2 text-xs text-gray-500">
                  {demoMessage.length}/400 characters
                </div>
              )}
            </div>
          )}

          {/* AI Draft Response - Approve/Edit/Reject Flow */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                AI Draft Response
              </label>
              <div className="flex items-center gap-3">
                {ticket.channel === 'sms' && response && (
                  <span className={`text-xs ${
                    response.length > 160 ? 'text-red-600 font-medium' :
                    response.length > 140 ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {response.length}/160
                  </span>
                )}
                {draftData?.tone && (
                  <span className="text-xs text-gray-500">
                    Tone: {draftData.tone}
                  </span>
                )}
              </div>
            </div>

            {isDraftLoading ? (
              <div className="w-full p-3 border border-gray-300 rounded text-sm bg-gray-50 h-32 flex items-center justify-center">
                <span className="text-gray-500">Generating AI response...</span>
              </div>
            ) : draftError ? (
              <div className="w-full p-3 border border-red-300 rounded text-sm bg-red-50">
                <div className="text-red-600 font-medium mb-1">Quimbi AI Error</div>
                <div className="text-red-500 text-xs">
                  {(draftError as Error).message || 'Failed to generate draft response'}
                </div>
              </div>
            ) : isEditing ? (
              /* Edit Mode */
              <>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={ticket.channel === 'sms' ? 4 : ticket.channel === 'chat' ? 6 : 10}
                  maxLength={ticket.channel === 'sms' ? 320 : undefined}
                  className={`w-full p-3 border rounded text-sm ${
                    ticket.channel === 'sms' && response.length > 160
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder={
                    ticket.channel === 'sms' ? 'Keep it short - SMS limit is 160 characters' :
                    ticket.channel === 'chat' ? 'Keep it conversational' :
                    'Edit your response...'
                  }
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => sendResponse.mutate(response)}
                    disabled={sendResponse.isPending || !response.trim()}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendResponse.isPending ? 'Sending...' : 'Send'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      if (draftData?.draft) setResponse(draftData.draft);
                    }}
                    className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* View Mode - Show draft with action buttons */
              <>
                <div className="w-full p-3 border border-gray-300 rounded text-sm bg-gray-50 whitespace-pre-wrap">
                  {response || 'No draft available'}
                </div>

                {draftData?.personalization_applied && draftData.personalization_applied.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Personalization: </span>
                    {draftData.personalization_applied.join(' • ')}
                  </div>
                )}

                {/* Approve/Edit/Regenerate Buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => sendResponse.mutate(response)}
                    disabled={sendResponse.isPending || !response.trim()}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {sendResponse.isPending ? 'Sending...' : '✓ Send'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                  >
                    ✏️ Edit
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                      className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                    >
                      ↻ Regenerate {showRegenerateMenu ? '▲' : '▼'}
                    </button>
                    {showRegenerateMenu && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[140px]">
                        <button
                          onClick={() => {
                            regenerateDraft.mutate('friendly');
                            setShowRegenerateMenu(false);
                          }}
                          disabled={regenerateDraft.isPending}
                          className="block w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 disabled:opacity-50"
                        >
                          Friendly
                        </button>
                        <button
                          onClick={() => {
                            regenerateDraft.mutate('professional');
                            setShowRegenerateMenu(false);
                          }}
                          disabled={regenerateDraft.isPending}
                          className="block w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 disabled:opacity-50"
                        >
                          Professional
                        </button>
                        <button
                          onClick={() => {
                            regenerateDraft.mutate('empathetic');
                            setShowRegenerateMenu(false);
                          }}
                          disabled={regenerateDraft.isPending}
                          className="block w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 disabled:opacity-50"
                        >
                          Empathetic
                        </button>
                        <button
                          onClick={() => {
                            regenerateDraft.mutate('apologetic');
                            setShowRegenerateMenu(false);
                          }}
                          disabled={regenerateDraft.isPending}
                          className="block w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 disabled:opacity-50"
                        >
                          Apologetic
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Internal Notes Section */}
          <div className="mb-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Internal Notes</label>
              {!showNoteInput && (
                <button
                  onClick={() => setShowNoteInput(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Add Note
                </button>
              )}
            </div>

            {/* Existing notes */}
            {ticket.notes && ticket.notes.length > 0 && (
              <div className="space-y-2 mb-3">
                {ticket.notes.map((note) => (
                  <div key={note.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <div className="text-xs text-gray-500 mb-1">
                      {note.author_name || 'Agent'} • {new Date(note.created_at).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{note.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Add note input */}
            {showNoteInput && (
              <div>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-yellow-300 rounded text-sm bg-yellow-50"
                  placeholder="Add internal note (not visible to customer)..."
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => addNote.mutate(internalNote)}
                    disabled={addNote.isPending || !internalNote.trim()}
                    className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {addNote.isPending ? 'Saving...' : 'Save Note'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNoteInput(false);
                      setInternalNote('');
                    }}
                    className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            {ticket.status !== 'closed' ? (
              <button
                onClick={() => closeTicket.mutate()}
                disabled={closeTicket.isPending}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {closeTicket.isPending ? 'Closing...' : 'Close Ticket'}
              </button>
            ) : (
              <span className="px-4 py-2 text-green-600 font-medium">
                ✓ Ticket Closed
              </span>
            )}
          </div>
        </div>

        {/* Customer Intelligence Card - Right Side */}
        <div className="w-80">
          <div className="sticky top-4 space-y-4">
            {/* Customer Profile Card */}
            <div className="border border-gray-300 rounded p-4">
              <h2 className="text-sm font-bold mb-3">Customer Intelligence</h2>

              {profile ? (
                <>
                  {/* Shopify KPIs */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">SHOPIFY DATA</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lifetime Value</span>
                        <span className="font-medium">${metrics?.lifetime_value?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Orders</span>
                        <span className="font-medium">{metrics?.total_orders || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Order Value</span>
                        <span className="font-medium">${metrics?.avg_order_value?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Since</span>
                        <span className="font-medium">
                          {metrics?.customer_tenure_days
                            ? `${Math.floor(metrics.customer_tenure_days / 365)}y ${Math.floor((metrics.customer_tenure_days % 365) / 30)}m`
                            : 'New'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Purchase</span>
                        <span className="font-medium">
                          {metrics?.days_since_last_purchase
                            ? `${metrics.days_since_last_purchase}d ago`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last Purchase Details */}
                  {profile.last_purchase && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs font-medium text-blue-900 mb-2">LAST PURCHASE</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700 font-medium">Order #{profile.last_purchase.order_number}</span>
                          <span className="text-blue-900 font-semibold">${parseFloat(profile.last_purchase.total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-600">
                            {new Date(profile.last_purchase.order_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-blue-600">
                            {profile.last_purchase.days_ago ? `${profile.last_purchase.days_ago}d ago` : ''}
                          </span>
                        </div>
                        <div className="text-xs text-blue-700">
                          <span className="font-medium">Status:</span> {profile.last_purchase.status || 'N/A'} | {profile.last_purchase.fulfillment_status || 'N/A'}
                        </div>
                        {profile.last_purchase.products && profile.last_purchase.products.length > 0 && (() => {
                          // Filter out insurance/protection products and group duplicates
                          const productMap = new Map<string, number>();
                          profile.last_purchase.products.forEach(product => {
                            const title = product.title || '';
                            // Skip ShipInsure and other protection products
                            if (title.toLowerCase().includes('shipinsure') ||
                                title.toLowerCase().includes('package protection')) {
                              return;
                            }
                            const currentQty = productMap.get(title) || 0;
                            productMap.set(title, currentQty + (product.quantity || 1));
                          });

                          const uniqueProducts = Array.from(productMap.entries())
                            .map(([title, quantity]) => ({ title, quantity }));

                          // Limit to first 5 products
                          const displayProducts = uniqueProducts.slice(0, 5);
                          const hasMore = uniqueProducts.length > 5;

                          return displayProducts.length > 0 ? (
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <div className="text-xs font-medium text-blue-700 mb-1">Products:</div>
                              {displayProducts.map((product, idx) => (
                                <div key={idx} className="text-xs text-blue-700">
                                  • {product.title} (×{product.quantity})
                                </div>
                              ))}
                              {hasMore && (
                                <div className="text-xs text-blue-600 italic mt-1">
                                  + {uniqueProducts.length - 5} more items
                                </div>
                              )}
                            </div>
                          ) : null;
                        })()}
                        {profile.last_purchase?.tracking_numbers && profile.last_purchase.tracking_numbers.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <div className="text-xs font-medium text-blue-700 mb-1">Tracking:</div>
                            {profile.last_purchase.tracking_numbers.map((tracking, idx) => (
                              <div key={idx} className="text-xs">
                                {profile.last_purchase?.tracking_urls && profile.last_purchase.tracking_urls[idx] ? (
                                  <a
                                    href={profile.last_purchase.tracking_urls[idx]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-mono"
                                  >
                                    {tracking}
                                  </a>
                                ) : (
                                  <span className="text-blue-700 font-mono">{tracking}</span>
                                )}
                                {profile.last_purchase?.shipping_carrier && (
                                  <span className="text-blue-600 ml-1">({profile.last_purchase.shipping_carrier})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quimbi Intelligence */}
                  <div className="mb-4 pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-2">QUIMBI INTELLIGENCE</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Churn Risk</span>
                        <span className={`font-medium ${
                          churnScore > 0.7 ? 'text-red-600' :
                          churnScore > 0.4 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {(churnScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Archetype</span>
                        <span className="font-medium text-xs">
                          {profile.archetype?.id
                            ? profile.archetype.id.replace('arch_', '').replace(/_/g, ' ')
                            : metrics?.total_orders === 0
                            ? 'No orders yet'
                            : 'Calculating...'}
                        </span>
                      </div>
                    </div>

                    {/* Dominant Segments */}
                    {profile.dominant_segments && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Key Behaviors</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(profile.dominant_segments).slice(0, 4).map(([axis, segment]) => (
                            <span
                              key={axis}
                              className="text-xs px-2 py-0.5 bg-gray-100 rounded"
                            >
                              {String(segment).replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {recommendations && recommendations.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-500 mb-2">HOW TO TALK TO THIS CUSTOMER</div>
                      <ul className="text-xs text-gray-700 space-y-1">
                        {recommendations.map((tip, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  No customer profile available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
