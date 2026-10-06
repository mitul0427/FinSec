import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { aiApi } from '../utils/api';
import { sanitizeText } from '../utils/sanitize';

const QUICK_PROMPTS = [
  'Spent $16.50 on Chipotle under Food & Dining',
  'Set monthly budget $450 for Shopping',
  'Add income $1200 for Freelance Consulting',
  'Analyze my current financial health'
];

export const AiAssistantWidget = ({ onActionExecuted }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Greetings. I am **FinSec AI**, your secure personal financial co-pilot. I can record transactions, adjust budget thresholds, and analyze your cash flow. All actions are validated against strict Zod schemas before hitting the database.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText = input) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.assistant(q);
      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply,
            proposal: data.proposal,
            securityAlert: data.securityAlert
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'I encountered an error processing your financial request.'
          }
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Security Gateway timeout. Please verify backend connection.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [confirming, setConfirming] = useState(false);

  const handleConfirmProposal = async (msgIndex, proposal) => {
    setConfirming(true);
    try {
      const res = await aiApi.confirmAction(proposal);
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === msgIndex ? { ...m, proposalConfirmed: true, confirmedDetails: data } : m
          )
        );
        if (onActionExecuted) onActionExecuted();
      } else {
        alert(data.error || 'Action confirmation failed.');
      }
    } catch (e) {
      alert('Network error confirming action.');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelProposal = (msgIndex) => {
    setMessages((prev) =>
      prev.map((m, idx) => (idx === msgIndex ? { ...m, proposalCancelled: true } : m))
    );
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 text-white shadow-md shadow-cyan-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center">
              FinSec AI Financial Assistant
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono flex items-center">
              <Shield className="w-3 h-3 text-emerald-400 mr-1 inline" />
              Zod Schema Validated Action Mapping
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
          Gemini 2.0
        </span>
      </div>

      {/* Quick Action Chips */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/50 flex items-center space-x-2 overflow-x-auto text-[11px] scrollbar-none">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap">
          Quick Prompts:
        </span>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-cyan-600/10'
                  : 'glass-panel border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div
                dangerouslySetInnerHTML={{ __html: sanitizeText(m.text) }}
                className="leading-relaxed"
              />

              {/* Security Alert Badge */}
              {m.securityAlert && (
                <div className="mt-2.5 p-2 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center text-[11px] text-rose-300 font-mono">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-400 shrink-0" />
                  <span>Adversarial Prompt Injection Blocked & Logged to SOC</span>
                </div>
              )}

              {/* Proposed Action Card (Requires User Confirmation) */}
              {m.proposal && !m.proposalConfirmed && !m.proposalCancelled && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-xs space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Action Proposal (Requires Confirmation)</span>
                  </div>

                  {m.proposal.type === 'CREATE_TRANSACTION' && (
                    <div className="font-mono text-slate-300 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Operation:</span>
                        <span className="text-cyan-300 font-semibold">RECORD_TRANSACTION</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type:</span>
                        <span className={m.proposal.transaction?.type === 'INCOME' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {m.proposal.transaction?.type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount:</span>
                        <span className="text-white font-bold">₹{m.proposal.transaction?.amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Category:</span>
                        <span className="text-slate-200">{m.proposal.transaction?.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Description:</span>
                        <span className="text-slate-200">{m.proposal.transaction?.description}</span>
                      </div>
                    </div>
                  )}

                  {m.proposal.type === 'SET_BUDGET' && (
                    <div className="font-mono text-slate-300 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Operation:</span>
                        <span className="text-cyan-300 font-semibold">SET_BUDGET</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Category:</span>
                        <span className="text-slate-200">{m.proposal.budget?.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Limit:</span>
                        <span className="text-white font-bold">₹{m.proposal.budget?.limitAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handleConfirmProposal(idx, m.proposal)}
                      disabled={confirming}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 shadow-md transition-all"
                    >
                      {confirming ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                          <span>Chaining...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Confirm & Sign to Ledger</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelProposal(idx)}
                      disabled={confirming}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Proposal Confirmed */}
              {m.proposalConfirmed && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center text-[10px] text-emerald-400 font-mono">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />
                  <span>Action Confirmed & Cryptographically Chained to SHA-256 Ledger</span>
                </div>
              )}

              {/* Proposal Cancelled */}
              {m.proposalCancelled && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center text-[10px] text-slate-500 font-mono">
                  <span>Action Cancelled by User (Zero Trust Guard)</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass-panel border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <span>Grounding query with Zod schema...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or speak a financial instruction..."
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white shadow-md shadow-cyan-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
