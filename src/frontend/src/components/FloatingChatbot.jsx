import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Sparkles,
  Shield,
  CornerDownLeft,
  ChevronDown
} from 'lucide-react';
import { aiApi } from '../utils/api';

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your FinSec AI financial co-pilot. Ask me anything about your balances, spending breakdown, or security posture.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    // Append user message
    const userMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Realistic Mock Response Engine for Hackathon
    setTimeout(async () => {
      let replyText = '';
      const lower = query.toLowerCase();

      if (lower.includes('how much') || lower.includes('spend') || lower.includes('expense')) {
        replyText = 'You have spent ₹12,450 this month. Your highest expense is Shopping at ₹4,500, followed by Food & Dining at ₹3,200.';
      } else if (lower.includes('wallet') || lower.includes('balance')) {
        replyText = 'Your verified wallet balance is ₹4,523.98 with ₹3,030.98 in incoming salary and ₹223.98 in recorded utility bills.';
      } else if (lower.includes('anomaly') || lower.includes('security') || lower.includes('fraud')) {
        replyText = 'ZeroTrust AI active defense is running. 1 anomalous transaction in Moscow, Russia (₹50,000) was quarantined in PENDING_CONFIRMATION.';
      } else {
        // Try real AI backend endpoint if connected, or fallback
        try {
          const res = await aiApi.assistant(query);
          if (res.ok) {
            const data = await res.json();
            replyText = data.reply || 'Your financial request has been securely processed.';
          } else {
            replyText = `Based on your ZeroTrust financial ledger, your spending is currently 29% below your monthly target limit.`;
          }
        } catch (err) {
          replyText = `Based on your ZeroTrust financial ledger, your spending is currently 29% below your monthly target limit.`;
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-600/40 flex items-center space-x-2 transition-all hover:scale-105"
        >
          <Bot className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wide pr-1">Ask AI Co-Pilot</span>
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-white/10">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center">
                  FinSec AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300 ml-1.5" />
                </h3>
                <p className="text-[10px] text-indigo-100 flex items-center">
                  <Shield className="w-2.5 h-2.5 mr-1 inline" /> ZeroTrust Financial Co-Pilot
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => {
                setInput('How much did I spend?');
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 whitespace-nowrap transition-all font-semibold"
            >
              How much did I spend?
            </button>
            <button
              onClick={() => {
                setInput('Show wallet balance');
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 whitespace-nowrap transition-all font-semibold"
            >
              Show balance
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm font-medium'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3 text-xs text-slate-500 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
                  <span>Analyzing encrypted financial ledger...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask e.g. How much did I spend?..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
