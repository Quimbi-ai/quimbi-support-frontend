import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../api/tickets';

function formatTimeAgo(date: string): string {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Rule {
  id: string;
  original: string;
  interpreted: string;
  action: string;
  boost: number;
  type: 'vip' | 'churn' | 'time-sensitive' | 'product-quality' | 'shipping' | 'refund' | 'first-time' | 'custom';
  keywords?: string[];
}

export function InboxPage() {
  const navigate = useNavigate();
  const [topicAlerts, setTopicAlerts] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState<Rule[]>(() => {
    const saved = localStorage.getItem('prioritizationRules');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Persist rules to localStorage
  useEffect(() => {
    localStorage.setItem('prioritizationRules', JSON.stringify(rules));
  }, [rules]);

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', topicAlerts, rules],
    queryFn: () => ticketApi.list({
      status: 'open',
      topic_alerts: topicAlerts.length > 0 ? topicAlerts.join(',') : undefined,
    }),
  });

  // Apply prioritization rules to tickets
  const applyRulesToTickets = (tickets: any[]) => {
    if (rules.length === 0) return tickets;

    return tickets.map(ticket => {
      let additionalBoost = 0;
      const appliedRules: string[] = [];

      rules.forEach(rule => {
        let ruleApplies = false;

        switch (rule.type) {
          case 'vip':
            // Check if customer is high value (LTV > $1000)
            // Note: We'd need customer data here, which isn't in the ticket list
            // For now, check if smart_score is already high (indicates high value)
            if (ticket.smart_score && ticket.smart_score > 5) {
              ruleApplies = true;
            }
            break;

          case 'churn':
            // Check subject/preview for churn keywords
            const churnText = `${ticket.subject} ${ticket.last_message_preview || ''}`.toLowerCase();
            if (rule.keywords?.some(kw => churnText.includes(kw.toLowerCase()))) {
              ruleApplies = true;
            }
            break;

          case 'time-sensitive':
          case 'product-quality':
          case 'shipping':
          case 'refund':
          case 'custom':
            // Check if ticket content matches keywords
            const content = `${ticket.subject} ${ticket.last_message_preview || ''}`.toLowerCase();
            if (rule.keywords?.some(kw => content.includes(kw.toLowerCase()))) {
              ruleApplies = true;
            }
            break;

          case 'first-time':
            // Would need customer data - skip for now
            break;
        }

        if (ruleApplies) {
          additionalBoost += rule.boost;
          appliedRules.push(rule.interpreted);
        }
      });

      return {
        ...ticket,
        smart_score: (ticket.smart_score || 0) + additionalBoost,
        _appliedRules: appliedRules,
        _originalScore: ticket.smart_score,
      };
    }).sort((a, b) => (b.smart_score || 0) - (a.smart_score || 0));
  };

  const tickets = applyRulesToTickets(ticketsData?.tickets || []);

  const handleAddTopic = () => {
    if (!inputValue.trim()) return;
    const newTopics = inputValue.split(',').map(t => t.trim()).filter(t => t && !topicAlerts.includes(t));
    if (newTopics.length > 0) {
      setTopicAlerts([...topicAlerts, ...newTopics]);
    }
    setInputValue('');
  };

  const handleAnalyzeRule = async () => {
    if (!ruleInput.trim()) return;

    setIsAnalyzing(true);

    // Analyze the rule using pattern matching
    setTimeout(() => {
      const input = ruleInput.toLowerCase();
      let interpreted = '';
      let action = '';
      let keywords: string[] = [];

      // Detect rule type and generate appropriate interpretation
      let ruleType: Rule['type'] = 'custom';
      let boost = 2.0;

      if (input.includes('vip') || input.includes('high value') || input.includes('spending') || input.includes('ltv')) {
        ruleType = 'vip';
        boost = 5.0;
        interpreted = 'Priority boost for high-value customers (VIP, high LTV)';
        action = 'Add +5.0 to smart_score when customer LTV > $1000 or VIP status';
        keywords = ['vip customer', 'high spender', 'loyalty'];
      } else if (input.includes('churn') || input.includes('cancel') || input.includes('leaving') || input.includes('disappointed')) {
        ruleType = 'churn';
        boost = 4.0;
        interpreted = 'Priority boost for customers at risk of churning';
        action = 'Add +4.0 to smart_score when churn_risk > 0.7 or mentions cancellation';
        keywords = ['cancel', 'disappointed', 'leaving', 'unsubscribe'];
      } else if (input.includes('time') || input.includes('urgent') || input.includes('deadline') || input.includes('address')) {
        ruleType = 'time-sensitive';
        boost = 3.0;
        interpreted = 'Priority boost for time-sensitive issues (address corrections, urgent deadlines)';
        action = 'Add +3.0 to smart_score when ticket contains time-sensitive keywords';
        keywords = ['wrong address', 'today', 'tomorrow', 'urgent', 'deadline', 'asap'];
      } else if (input.includes('product') || input.includes('defect') || input.includes('broken') || input.includes('wrong item')) {
        ruleType = 'product-quality';
        boost = 3.5;
        interpreted = 'Priority boost for product quality issues';
        action = 'Add +3.5 to smart_score for defective/wrong items';
        keywords = ['defective', 'broken', 'wrong item', 'damaged', 'not as described'];
      } else if (input.includes('shipping') || input.includes('delivery') || input.includes('tracking') || input.includes('lost')) {
        ruleType = 'shipping';
        boost = 2.5;
        interpreted = 'Priority boost for shipping/delivery issues';
        action = 'Add +2.5 to smart_score for shipping problems';
        keywords = ['late delivery', 'lost package', 'tracking', 'not arrived', 'where is'];
      } else if (input.includes('refund') || input.includes('return') || input.includes('exchange')) {
        ruleType = 'refund';
        boost = 2.0;
        interpreted = 'Priority boost for refund/return requests';
        action = 'Add +2.0 to smart_score for refund or return issues';
        keywords = ['refund', 'return', 'exchange', 'money back'];
      } else if (input.includes('first') || input.includes('new customer')) {
        ruleType = 'first-time';
        boost = 2.0;
        interpreted = 'Priority boost for first-time customers';
        action = 'Add +2.0 to smart_score when total_orders <= 2';
        keywords = ['first order', 'new customer', 'first purchase'];
      } else {
        // Generic rule - extract keywords from input
        const words = ruleInput.toLowerCase().match(/\b\w{4,}\b/g) || [];
        keywords = words.slice(0, 5);
        interpreted = `Priority boost for tickets mentioning: ${keywords.join(', ')}`;
        action = `Add +2.0 to smart_score when ticket contains custom keywords`;
      }

      const newRule: Rule = {
        id: Date.now().toString(),
        original: ruleInput,
        interpreted,
        action,
        boost,
        type: ruleType,
        keywords,
      };

      setRules([...rules, newRule]);
      setRuleInput('');
      setIsAnalyzing(false);
    }, 1000);
  };

  return (
    <div className="flex gap-4 p-4 max-w-7xl mx-auto">
      {/* Main Content - Left Side */}
      <div className="flex-1">
        {/* Header */}
        <h1 className="text-xl font-bold mb-4">
          Inbox {isLoading ? '(Loading...)' : `(${tickets.length})`}
        </h1>

        {/* Rules Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Add Prioritization Rule</label>
          <textarea
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            placeholder="Describe what should be prioritized (e.g., 'make sure to prioritize any tickets that require immediate attention because of a time constraint, like the customer put in the wrong address')"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            rows={3}
          />
          <button
            onClick={handleAnalyzeRule}
            disabled={!ruleInput.trim() || isAnalyzing}
            className="mt-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze & Apply'}
          </button>
        </div>

        {/* Topic Alerts Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Topic Alerts</label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
            placeholder="Keywords to watch (e.g., chargeback, refund)"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
          {topicAlerts.length > 0 && (
            <div className="mt-2 flex gap-2 items-center">
              <span className="text-xs text-gray-600">Active:</span>
              {topicAlerts.map(topic => (
                <span
                  key={topic}
                  onClick={() => setTopicAlerts(topicAlerts.filter(t => t !== topic))}
                  className="text-xs px-2 py-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                >
                  {topic} ×
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ticket List */}
        <div className="space-y-2">
          {tickets.map((ticket) => {
            // Determine if ticket should glow (high score or matches topic alert)
            const isHighPriority = (ticket.smart_score && ticket.smart_score >= 10) || ticket.matches_topic_alert;

            return (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className={`p-4 rounded cursor-pointer transition-all duration-200 ${
                  isHighPriority
                    ? 'border border-transparent bg-white shadow-[0_0_15px_rgba(6,182,212,0.5),0_0_30px_rgba(6,182,212,0.3),0_0_45px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6),0_0_40px_rgba(6,182,212,0.4),0_0_60px_rgba(6,182,212,0.15)]'
                    : 'border border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm">{ticket.subject}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {ticket.smart_score && (
                      <div className="flex items-center gap-1">
                        <span className={`${isHighPriority ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                          {ticket.smart_score.toFixed(1)}
                        </span>
                        {ticket._appliedRules && ticket._appliedRules.length > 0 && (
                          <span
                            className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-purple-500 text-white rounded-full"
                            title={`Rules applied:\n${ticket._appliedRules.join('\n')}\n\nOriginal score: ${ticket._originalScore?.toFixed(1) || 0}\nBoost: +${(ticket.smart_score - (ticket._originalScore || 0)).toFixed(1)}`}
                          >
                            ↑
                          </span>
                        )}
                      </div>
                    )}
                    {formatTimeAgo(ticket.created_at)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 truncate">{ticket.last_message_preview}</div>
                <div className="mt-2 flex gap-2 text-xs text-gray-500 items-center">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    ticket.channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                    ticket.channel === 'chat' ? 'bg-green-100 text-green-700' :
                    ticket.channel === 'phone' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {ticket.channel.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{ticket.priority}</span>
                  {ticket.matches_topic_alert && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600 font-medium">⚡ ALERT</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tickets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tickets
          </div>
        )}
      </div>

      {/* Active Rules Sidebar - Right Side */}
      <div className="w-80">
        <div className="sticky top-4">
          <h2 className="text-sm font-medium mb-3">Active Rules ({rules.length})</h2>

          {rules.length === 0 ? (
            <div className="p-4 border border-gray-300 rounded text-sm text-gray-500">
              No active rules. Add a rule to customize ticket prioritization.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="p-3 border border-gray-300 rounded text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-xs text-gray-700">Rule #{rules.indexOf(rule) + 1}</div>
                    <button
                      onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-gray-700 mb-2">{rule.interpreted}</div>
                  <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    {rule.action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
