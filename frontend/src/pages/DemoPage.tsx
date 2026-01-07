import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../api/tickets';
import { aiApi } from '../api/ai';

// Pre-built demo scenarios
const SCENARIOS = [
  {
    id: 'high-value-complaint',
    name: 'High-Value Customer Complaint',
    description: 'Premium customer received wrong item',
    channel: 'email' as const,
    customer_id: '5676109660335', // Mid-tier, 60% churn risk
    subject: 'Wrong item in my order',
    message: "I ordered the Tula Pink fat quarter bundle but received completely different fabrics. This is really frustrating - I needed these for a class I'm teaching this weekend. This isn't the first time I've had issues with orders.",
  },
  {
    id: 'churn-risk',
    name: 'Churn Risk - Cancellation Request',
    description: 'At-risk customer wants to cancel',
    channel: 'chat' as const,
    customer_id: '6345476407551',
    subject: 'Want to cancel my account',
    message: "I want to cancel. I've been a customer for years but the last few orders have been disappointing. Shipping is slow and prices keep going up. I can find better deals elsewhere.",
  },
  {
    id: 'quick-sms',
    name: 'Quick SMS Question',
    description: 'Simple tracking inquiry via SMS',
    channel: 'sms' as const,
    customer_id: '7234470772991',
    subject: 'Tracking question',
    message: "Where's my order? It was supposed to arrive yesterday.",
  },
  {
    id: 'product-question',
    name: 'Product Recommendation',
    description: 'New quilter needs guidance',
    channel: 'chat' as const,
    customer_id: '4612386521263',
    subject: 'Help choosing batting',
    message: "I'm making my first quilt and I'm overwhelmed by all the batting options. It's a baby quilt that will be washed frequently. What do you recommend?",
  },
];

// Customer profiles for context (synced with backend data)
const CUSTOMER_PROFILES: Record<string, { name: string; ltv: number; orders: number; churn: number; tenure: string }> = {
  '5676109660335': { name: 'Sarah M.', ltv: 1520.23, orders: 18, churn: 60, tenure: '3y 11m' },
  '6345476407551': { name: 'Jennifer K.', ltv: 5739.62, orders: 42, churn: 75, tenure: '3y' },
  '7234470772991': { name: 'Mike R.', ltv: 123.62, orders: 2, churn: 25, tenure: '1y 5m' },
  '4612386521263': { name: 'Amanda L.', ltv: 437.34, orders: 7, churn: 40, tenure: '3y 7m' },
};

export function DemoPage() {
  const queryClient = useQueryClient();
  const [selectedScenario, setSelectedScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [showBehindScenes, setShowBehindScenes] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');

  // Create ticket mutation
  const createTicket = useMutation({
    mutationFn: async (scenario: typeof SCENARIOS[0]) => {
      const customerProfile = CUSTOMER_PROFILES[scenario.customer_id];
      const result = await ticketApi.create({
        customer_id: scenario.customer_id,
        subject: scenario.subject,
        channel: scenario.channel,
        priority: scenario.id === 'churn-risk' ? 'urgent' : 'normal',
        initial_message: customMessage || scenario.message,
        author_name: customerProfile?.name || 'Demo Customer',
        author_email: `${scenario.customer_id}@demo.quimbi.com`,
      });

      // For chat/SMS, automatically send AI greeting and response
      if (scenario.channel === 'chat' || scenario.channel === 'sms') {
        // Send standard greeting first
        await ticketApi.sendMessage(result.ticket.id, {
          content: "Hi! Let me look into this for you.",
          from_agent: true,
          author_name: 'Quimbi AI',
        });

        // Small delay then get AI response
        await new Promise(resolve => setTimeout(resolve, 300));
        const draft = await aiApi.getDraftResponse(result.ticket.id);

        // Split long responses into multiple messages for chat
        const maxLen = scenario.channel === 'sms' ? 160 : 250;
        const responses = splitMessage(draft.draft, maxLen);

        for (const response of responses) {
          await ticketApi.sendMessage(result.ticket.id, {
            content: response,
            from_agent: true,
            author_name: 'Quimbi AI',
          });
        }
      }

      return result;
    },
    onSuccess: (data) => {
      setCreatedTicketId(data.ticket.id);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // Helper to split long messages at sentence boundaries
  const splitMessage = (text: string, maxLen: number): string[] => {
    if (text.length <= maxLen) return [text];

    const messages: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxLen) {
        messages.push(remaining);
        break;
      }

      // Find last sentence break within limit
      let splitIndex = maxLen;
      const lastPeriod = remaining.lastIndexOf('. ', maxLen);
      const lastQuestion = remaining.lastIndexOf('? ', maxLen);
      const lastExclaim = remaining.lastIndexOf('! ', maxLen);

      const bestBreak = Math.max(lastPeriod, lastQuestion, lastExclaim);
      if (bestBreak > maxLen * 0.5) {
        splitIndex = bestBreak + 1;
      }

      messages.push(remaining.substring(0, splitIndex).trim());
      remaining = remaining.substring(splitIndex).trim();
    }

    return messages;
  };

  // Send reply mutation (as customer) then auto-generate AI response
  const sendReply = useMutation({
    mutationFn: async (content: string) => {
      // First send customer message
      const customerProfile = selectedScenario ? CUSTOMER_PROFILES[selectedScenario.customer_id] : null;
      await ticketApi.sendMessage(createdTicketId!, {
        content,
        from_agent: false,
        author_name: customerProfile?.name || 'Customer',
      });

      // Small delay to ensure backend processes the new message
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then get AI draft and send it as agent response
      const draft = await aiApi.getDraftResponse(createdTicketId!);

      // Split long responses into multiple messages
      const maxLen = ticket?.channel === 'sms' ? 160 : 250;
      const responses = splitMessage(draft.draft, maxLen);

      // Send each message part
      for (const response of responses) {
        await ticketApi.sendMessage(createdTicketId!, {
          content: response,
          from_agent: true,
          author_name: 'Quimbi AI',
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['ticket', createdTicketId] });
      // Refetch draft to get updated AI response for new conversation context
      refetchDraft();
    },
  });

  // Close ticket mutation
  const closeTicket = useMutation({
    mutationFn: async () => {
      return ticketApi.update(createdTicketId!, { status: 'closed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', createdTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // Fetch ticket details
  const { data: ticket } = useQuery({
    queryKey: ['ticket', createdTicketId],
    queryFn: () => ticketApi.getById(createdTicketId!),
    enabled: !!createdTicketId,
  });

  // Fetch AI draft
  const { data: draftData, isLoading: isDraftLoading, refetch: refetchDraft } = useQuery({
    queryKey: ['draft', createdTicketId],
    queryFn: () => aiApi.getDraftResponse(createdTicketId!),
    enabled: !!createdTicketId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  const handleRunScenario = () => {
    if (!selectedScenario) return;
    setCreatedTicketId(null);
    createTicket.mutate(selectedScenario);
  };

  const handleReset = () => {
    setSelectedScenario(null);
    setCreatedTicketId(null);
    setCustomMessage('');
  };

  const customerProfile = selectedScenario ? CUSTOMER_PROFILES[selectedScenario.customer_id] : null;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Interactive Demo</h1>
        <p className="text-gray-600 mt-1">
          Experience how Quimbi's AI responds to different customer scenarios
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left Panel - Scenario Selection & Customer View */}
        <div className="flex-1">
          {!createdTicketId ? (
            <>
              {/* Scenario Picker */}
              <div className="mb-6">
                <h2 className="text-sm font-medium mb-3">Select a Scenario</h2>
                <div className="grid grid-cols-2 gap-3">
                  {SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        setSelectedScenario(scenario);
                        setCustomMessage(scenario.message);
                      }}
                      className={`p-4 border rounded text-left transition-all ${
                        selectedScenario?.id === scenario.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium text-sm">{scenario.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{scenario.description}</div>
                      <div className="mt-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          scenario.channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                          scenario.channel === 'chat' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {scenario.channel.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Message Input */}
              {selectedScenario && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-medium">Customer Message</h2>
                    <span className="text-xs text-gray-500">
                      You can edit this before sending
                    </span>
                  </div>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={handleRunScenario}
                    disabled={createTicket.isPending}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createTicket.isPending ? 'Creating Ticket...' : 'Send to Support →'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Ticket Created - Show Conversation */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  {ticket?.channel === 'sms' || ticket?.channel === 'chat'
                    ? 'Conversation'
                    : 'Ticket Created'}
                </h2>
                <button
                  onClick={handleReset}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  ← Try Another Scenario
                </button>
              </div>

              {/* Channel Badge */}
              {ticket && (
                <div className="mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    ticket.channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                    ticket.channel === 'chat' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {ticket.channel.toUpperCase()}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">{ticket.subject}</span>
                </div>
              )}

              {/* Messages */}
              {ticket && (ticket.channel === 'sms' || ticket.channel === 'chat') ? (
                <div className="mb-4 space-y-3 p-3 bg-gray-50 rounded max-h-64 overflow-y-auto">
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
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : ticket ? (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  {ticket.messages?.map((msg) => (
                    <div key={msg.id} className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* AI Response */}
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">
                  Quimbi AI Response
                  {draftData?.tone && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      Tone: {draftData.tone}
                    </span>
                  )}
                </h3>
                {isDraftLoading ? (
                  <div className="p-4 bg-blue-50 rounded border border-blue-200 text-center">
                    <div className="text-sm text-blue-600">Generating personalized response...</div>
                  </div>
                ) : draftData ? (
                  <div className={`p-3 rounded border ${
                    ticket?.channel === 'sms'
                      ? 'bg-blue-50 border-blue-200'
                      : ticket?.channel === 'chat'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{draftData.draft}</div>
                    {ticket?.channel === 'sms' && (
                      <div className={`mt-2 text-xs ${
                        draftData.draft.length > 160 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {draftData.draft.length} characters
                        {draftData.draft.length > 160 && ` (${Math.ceil(draftData.draft.length / 160)} SMS segments)`}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Reply Input for Chat/SMS */}
              {ticket && (ticket.channel === 'sms' || ticket.channel === 'chat') && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && replyMessage.trim() && sendReply.mutate(replyMessage)}
                      placeholder="Reply as customer... (AI will respond)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      maxLength={ticket.channel === 'sms' ? 320 : undefined}
                    />
                    <button
                      onClick={() => replyMessage.trim() && sendReply.mutate(replyMessage)}
                      disabled={!replyMessage.trim() || sendReply.isPending}
                      className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                        ticket.channel === 'chat' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {sendReply.isPending ? '...' : 'Send'}
                    </button>
                  </div>
                  {ticket.channel === 'sms' && replyMessage.length > 0 && (
                    <div className={`mt-1 text-xs ${replyMessage.length > 160 ? 'text-red-600' : 'text-gray-500'}`}>
                      {replyMessage.length}/160
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {ticket?.status !== 'closed' && (
                  <button
                    onClick={() => closeTicket.mutate()}
                    disabled={closeTicket.isPending}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    {closeTicket.isPending ? 'Closing...' : 'Close Ticket'}
                  </button>
                )}
                {ticket?.status === 'closed' && (
                  <span className="px-3 py-1.5 text-sm text-green-600 font-medium">
                    ✓ Ticket Closed
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Behind the Scenes */}
        <div className="w-80">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Behind the Scenes</h2>
              <button
                onClick={() => setShowBehindScenes(!showBehindScenes)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showBehindScenes ? 'Hide' : 'Show'}
              </button>
            </div>

            {showBehindScenes && (
              <div className="space-y-4">
                {/* Customer Profile */}
                {customerProfile && (
                  <div className="p-4 border border-gray-300 rounded">
                    <div className="text-xs font-medium text-gray-500 mb-2">CUSTOMER PROFILE</div>
                    <div className="text-sm font-medium mb-2">{customerProfile.name}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lifetime Value</span>
                        <span className="font-medium">${customerProfile.ltv.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Orders</span>
                        <span className="font-medium">{customerProfile.orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Since</span>
                        <span className="font-medium">{customerProfile.tenure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Churn Risk</span>
                        <span className={`font-medium ${
                          customerProfile.churn > 60 ? 'text-red-600' :
                          customerProfile.churn > 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {customerProfile.churn}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Intelligence Applied */}
                {draftData && (
                  <div className="p-4 border border-gray-300 rounded">
                    <div className="text-xs font-medium text-gray-500 mb-2">AI INTELLIGENCE APPLIED</div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Tone:</span>
                        <span className="ml-2 font-medium capitalize">{draftData.tone}</span>
                      </div>
                      {draftData.personalization_applied && draftData.personalization_applied.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Personalization:</div>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {draftData.personalization_applied.map((p, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-500">✓</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* What to Notice */}
                {selectedScenario && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded">
                    <div className="text-xs font-medium text-blue-700 mb-2">WHAT TO NOTICE</div>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {selectedScenario.id === 'high-value-complaint' && (
                        <>
                          <li>• Apologetic tone for frustrated customer</li>
                          <li>• References their purchase history</li>
                          <li>• Offers premium resolution (expedited shipping)</li>
                          <li>• Acknowledges past issues</li>
                        </>
                      )}
                      {selectedScenario.id === 'churn-risk' && (
                        <>
                          <li>• Urgent retention approach</li>
                          <li>• Addresses specific complaints</li>
                          <li>• Offers incentives to stay</li>
                          <li>• Empathetic acknowledgment of frustration</li>
                        </>
                      )}
                      {selectedScenario.id === 'quick-sms' && (
                        <>
                          <li>• Concise SMS-appropriate length</li>
                          <li>• Direct answer to the question</li>
                          <li>• Action-oriented response</li>
                        </>
                      )}
                      {selectedScenario.id === 'product-question' && (
                        <>
                          <li>• Educational, helpful tone</li>
                          <li>• Specific product recommendations</li>
                          <li>• Considers use case (baby quilt, washing)</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}

                {/* No scenario selected hint */}
                {!selectedScenario && (
                  <div className="p-4 border border-gray-200 rounded text-sm text-gray-500">
                    Select a scenario to see how Quimbi's AI adapts its response based on customer profile, channel, and context.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
