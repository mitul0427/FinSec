import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, ShieldCheck } from 'lucide-react';

export const MetricCards = ({ summary }) => {
  const { totalIncome = 0, totalExpense = 0, netSavings = 0, savingsRate = 0, transactionCount = 0 } = summary || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Income */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Income</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1 flex items-center font-medium">
            Verified Ingress Stream
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
      </div>

      {/* 2. Total Expense */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Expenses</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center">
            {transactionCount} logged transactions
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>
      </div>

      {/* 3. Net Savings */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Cash Flow</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold font-mono tracking-tight ${netSavings >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            ${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {netSavings >= 0 ? 'Positive balance reserve' : 'Deficit spending detected'}
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
      </div>

      {/* 4. Savings Rate */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Savings Rate</span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-purple-300 tracking-tight">
            {savingsRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 mr-1 inline" />
            Zero-Knowledge Target
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all"></div>
      </div>
    </div>
  );
};
