import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const CATEGORY_COLORS = {
  'Food & Dining': '#06b6d4', // cyan-500
  'Utilities': '#3b82f6',     // blue-500
  'Shopping': '#8b5cf6',      // purple-500
  'Travel': '#f59e0b',        // amber-500
  'Healthcare': '#10b981',    // emerald-500
  'Housing': '#ec4899',       // pink-500
  'Entertainment': '#6366f1', // indigo-500
  'Salary': '#22c55e',        // green-500
  'Investment': '#14b8a6',    // teal-500
  'Other': '#64748b'          // slate-500
};

export const ExpenseCharts = ({ summary, transactions = [] }) => {
  const { categoryBreakdown = {} } = summary || {};

  // 1. Prepare Pie Chart Data
  const pieData = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value
  }));

  // 2. Prepare Cash Flow Timeline Data
  const timelineMap = {};
  [...transactions].reverse().forEach((t) => {
    const dateKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!timelineMap[dateKey]) {
      timelineMap[dateKey] = { date: dateKey, income: 0, expense: 0 };
    }
    if (t.type === 'INCOME') timelineMap[dateKey].income += t.amount;
    else timelineMap[dateKey].expense += t.amount;
  });

  const timelineData = Object.values(timelineMap).slice(-10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cash Flow Timeline Chart */}
      <div className="glass-panel p-6 rounded-2xl lg:col-span-2 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Cryptographic Cash Flow Timeline</h3>
            <p className="text-xs text-slate-400">Income vs Expense trends with HMAC payload verification</p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
            Real-Time Stream
          </span>
        </div>

        <div className="h-64 w-full">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                  name="Income ($)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                  name="Expense ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Donut Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-slate-200">Expense Distribution</h3>
          <p className="text-xs text-slate-400">Categorical spending breakdown</p>
        </div>

        <div className="h-56 w-full flex-1">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[entry.name] || '#64748b'}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`$${val.toFixed(2)}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No expenses recorded yet.
            </div>
          )}
        </div>

        {/* Custom Legend Chips */}
        <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {pieData.map((item) => (
            <div
              key={item.name}
              className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[10px]"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[item.name] || '#64748b' }}
              />
              <span className="text-slate-300 truncate max-w-[90px]">{item.name}</span>
              <span className="text-slate-500 font-mono">${item.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
