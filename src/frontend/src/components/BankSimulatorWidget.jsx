import React, { useState } from 'react';
import { Landmark, Play, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { bankApi } from '../utils/api';

export const BankSimulatorWidget = ({ onSimulationComplete }) => {
  const [amount, setAmount] = useState('2500.00');
  const [merchant, setMerchant] = useState('Moscow Luxury Goods Ltd');
  const [location, setLocation] = useState('Moscow, Russia');
  const [category, setCategory] = useState('Shopping');
  const [loading, setLoading] = useState(false);
  const [responseInfo, setResponseInfo] = useState(null);

  const presets = [
    {
      label: 'Geographic Impossible (Russia)',
      amount: '450.00',
      merchant: 'Moscow Electronics Hub',
      location: 'Moscow, Russia',
      category: 'Shopping'
    },
    {
      label: '>3x Category Spike ($4,500 Dining)',
      amount: '4500.00',
      merchant: 'Le Grand Gourmet Palace',
      location: 'Hyderabad, India',
      category: 'Food & Dining'
    },
    {
      label: 'Normal Legitimate Transaction',
      amount: '35.00',
      merchant: 'Hyderabad Metro Coffee',
      location: 'Hyderabad, India',
      category: 'Food & Dining'
    }
  ];

  const handleSimulate = async () => {
    setLoading(true);
    setResponseInfo(null);
    try {
      const res = await bankApi.simulateWebhook({
        amount: parseFloat(amount),
        merchant,
        location,
        category,
        timestamp: new Date().toISOString()
      });
      const data = await res.json();
      setResponseInfo({ status: res.status, data });
      if (onSimulationComplete) onSimulationComplete();
    } catch (e) {
      setResponseInfo({ status: 500, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Landmark className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-bold text-slate-100">Live Bank Anomaly Simulator (Webhook)</h4>
        </div>
        <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60">
          POST /api/bank/webhook/transaction
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Simulate an incoming automated core-banking webhook transaction. Tests the real-time AI anomaly engine, Socket.io dashboard push, and interactive user approval/block modals.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 pt-1">
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setAmount(p.amount);
              setMerchant(p.merchant);
              setLocation(p.location);
              setCategory(p.category);
            }}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Merchant</label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
          >
            <option value="Food & Dining">Food & Dining</option>
            <option value="Shopping">Shopping</option>
            <option value="Housing">Housing</option>
            <option value="Utilities">Utilities</option>
            <option value="Travel">Travel</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Entertainment">Entertainment</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handleSimulate}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 flex items-center space-x-2 transition-all"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Evaluating Transaction...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Fire Webhook Transaction</span>
            </>
          )}
        </button>

        {responseInfo && (
          <div className="text-[11px] font-mono flex items-center space-x-2">
            {responseInfo.data?.status === 'PENDING_CONFIRMATION' ? (
              <span className="text-rose-400 font-bold flex items-center">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" /> FLAGGED: PENDING_CONFIRMATION
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> COMPLETED (Normal)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
