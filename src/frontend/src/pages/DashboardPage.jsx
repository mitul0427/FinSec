import React, { useState } from 'react';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Upload,
  Play,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { bankApi } from '../utils/api';
import { ReceiptScannerModal } from '../components/ReceiptScannerModal';

const MONTHLY_DATA = [
  { month: 'Jan', earnings: 12000 },
  { month: 'Feb', earnings: 19000 },
  { month: 'Mar', earnings: 15000 },
  { month: 'Apr', earnings: 22000 },
  { month: 'Mai', earnings: 25000 },
  { month: 'Jun', earnings: 22124 },
  { month: 'Jul', earnings: 28000 },
  { month: 'Agu', earnings: 26000 },
  { month: 'Sep', earnings: 31000 },
  { month: 'Ouc', earnings: 35000 }
];

const DONUT_DATA = [
  { name: 'Earnings', value: 4523.98, color: '#0f172a' },
  { name: 'Goals', value: 1200.0, color: '#e2e8f0' }
];

export const DashboardPage = ({ transactions, summary, onRefresh }) => {
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Default fallback mock values if summary loading
  const totalBalance = summary?.netSavings || 4523.98;
  const totalIncome = summary?.totalIncome || 3030.98;
  const totalExpense = summary?.totalExpense || 223.98;

  const handleTestAnomaly = async () => {
    setSimulating(true);
    try {
      await bankApi.simulateWebhook({
        amount: 50000.0,
        merchant: 'Moscow High Security Hub',
        location: 'Moscow, Russia',
        category: 'Shopping',
        timestamp: new Date().toISOString()
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Simulation trigger failed:', e);
    } finally {
      setSimulating(false);
    }
  };

  const defaultTransactions = [
    { id: '1', category: 'Shopping', date: 'Nov 25', amount: 300, type: 'EXPENSE' },
    { id: '2', category: 'Shopping', date: 'Nov 25', amount: 300, type: 'EXPENSE' },
    { id: '3', category: 'Shopping', date: 'Nov 25', amount: 300, type: 'EXPENSE' },
    { id: '4', category: 'Shopping', date: 'Nov 25', amount: 300, type: 'EXPENSE' },
    { id: '5', category: 'Shopping', date: 'Nov 25', amount: 300, type: 'EXPENSE' },
    { id: '6', category: 'Shopping', date: 'Nov 25', amount: 300, type: 'EXPENSE' }
  ];

  const txList = transactions && transactions.length > 0 ? transactions.slice(0, 6) : defaultTransactions;

  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h2>

      {/* Grid Layout matching reference design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Middle Column (Cols 1-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Row 1: Virtual Card & Wallet Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Virtual Debit Card */}
            <div className="h-48 rounded-3xl bg-gradient-to-br from-indigo-100 via-blue-100 to-indigo-200 p-6 flex flex-col justify-between shadow-sm border border-indigo-200/50 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">ZeroTrust Debit</span>
                <div className="flex space-x-1">
                  <div className="w-6 h-6 rounded-full bg-red-500/80"></div>
                  <div className="w-6 h-6 rounded-full bg-amber-500/80 -ml-3"></div>
                </div>
              </div>

              <div>
                <p className="text-lg font-mono font-bold tracking-widest text-slate-800">
                  4328 4388 4161 8183
                </p>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Card Holder</p>
                  <p className="text-xs font-bold text-slate-800">Marcel Dias</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Expires</p>
                  <p className="text-xs font-bold text-slate-800">12/31</p>
                </div>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="h-48 rounded-3xl bg-white p-6 flex flex-col justify-between shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wallet</span>
                <button
                  onClick={handleTestAnomaly}
                  disabled={simulating}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200 flex items-center space-x-1 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test Anomaly</span>
                </button>
              </div>

              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{typeof totalBalance === 'number' ? totalBalance.toLocaleString('en-IN') : totalBalance}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Income</p>
                    <p className="text-xs font-bold text-slate-800">₹{totalIncome}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Expenses</p>
                    <p className="text-xs font-bold text-slate-800">₹{totalExpense}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Transactions & Monthly Earnings Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Transactions List */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Transactions</h4>
              <div className="space-y-3">
                {txList.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-1 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{tx.category}</p>
                        <p className="text-[10px] text-slate-400">Nov 25</p>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-slate-900">
                      R$ {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Earnings Chart & Donut Chart */}
            <div className="space-y-6">
              
              {/* Line Graph */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly earnings</h4>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    Income <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MONTHLY_DATA}>
                      <Line
                        type="monotone"
                        dataKey="earnings"
                        stroke="#0f172a"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#0f172a' }}
                      />
                      <XAxis dataKey="month" hide />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Earnings Circular Donut Chart */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-2 text-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Earnings</h4>
                <div className="h-36 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={DONUT_DATA}
                        innerRadius={42}
                        outerRadius={58}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {DONUT_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-slate-900">₹4,523.98</span>
                    <span className="text-[9px] font-bold text-emerald-600">+29.0%</span>
                  </div>
                </div>
                <div className="flex justify-center space-x-4 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-900 mr-1.5"></span> Earnings
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-300 mr-1.5"></span> Goals
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel (Cols 9-12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Payable Accounts Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Payable Accounts</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Keep your accounts up to date to avoid issues.</p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">14 OUT OF 16</span>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-slate-900 h-full rounded-full w-[87.5%]"></div>
              </div>
            </div>
          </div>

          {/* Receipts Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Receipts</h4>
              <button
                onClick={() => setReceiptModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center space-x-1 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Receipt</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white text-slate-700 shadow-sm">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">₹5,000.00</p>
                    <p className="text-[10px] text-slate-400">Salary</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white text-slate-700 shadow-sm">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">₹593.00</p>
                    <p className="text-[10px] text-slate-400">Service</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white text-slate-700 shadow-sm">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">₹3,030.98</p>
                    <p className="text-[10px] text-slate-400">Rent or Mortgage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payables Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Payables</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white text-slate-700 shadow-sm">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">₹202.98</p>
                    <p className="text-[10px] text-slate-400">Electricity Bill</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white text-slate-700 shadow-sm">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">₹3,030.98</p>
                    <p className="text-[10px] text-slate-400">Rent or Mortgage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Receipt Upload */}
      <ReceiptScannerModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
