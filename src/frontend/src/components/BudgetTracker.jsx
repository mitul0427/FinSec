import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { budgetApi } from '../utils/api';

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Utilities',
  'Shopping',
  'Travel',
  'Housing',
  'Healthcare',
  'Entertainment'
];

export const BudgetTracker = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: 'Food & Dining', limitAmount: 500 });
  const [saving, setSaving] = useState(false);

  const fetchBudgets = async () => {
    try {
      const res = await budgetApi.list();
      if (res.ok) {
        const data = await res.json();
        setBudgets(data.budgets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSetBudget = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await budgetApi.set({
        category: newBudget.category,
        limitAmount: parseFloat(newBudget.limitAmount)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchBudgets();
      } else {
        alert('Failed to set budget.');
      }
    } catch (err) {
      alert('Error updating budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Remove this budget limit?')) return;
    try {
      await budgetApi.delete(id);
      fetchBudgets();
    } catch (e) {
      alert('Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Zero-Trust Budget Threshold Guard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated spending monitoring with proactive 80% warning and 100% hard-ceiling alerts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            Scanning budget allocations...
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 glass-panel rounded-2xl p-8">
            No budget limits defined yet. Configure categories above to activate threshold alerts.
          </div>
        ) : (
          budgets.map((b) => {
            const isExceeded = b.status === 'EXCEEDED';
            const isWarning = b.status === 'WARNING';

            return (
              <div
                key={b.id}
                className={`glass-panel p-5 rounded-2xl border transition-all ${
                  isExceeded
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : isWarning
                    ? 'border-amber-500/50 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">{b.category}</span>
                  <div className="flex items-center space-x-2">
                    {isExceeded ? (
                      <span className="flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60">
                        <AlertCircle className="w-3 h-3 mr-1" /> EXCEEDED
                      </span>
                    ) : isWarning ? (
                      <span className="flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60">
                        <AlertTriangle className="w-3 h-3 mr-1" /> NEAR CEILING
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> NORMAL
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="mt-4 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-xl font-bold text-slate-100">${b.spent.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 ml-1">spent</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Limit: </span>
                    <span className="text-xs font-semibold text-slate-300">${b.limitAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{b.percentage}% utilized</span>
                    <span>${b.remaining.toFixed(2)} remaining</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Set Budget */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-cyan-500/30">
            <h3 className="text-base font-bold text-slate-100 mb-1">Set Category Budget Limit</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your monthly limit. Threshold alerts trigger automatically at 80% capacity.
            </p>

            <form onSubmit={handleSetBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Ceiling Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={newBudget.limitAmount}
                  onChange={(e) => setNewBudget({ ...newBudget, limitAmount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
                >
                  {saving ? 'Encrypting...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
