import React, { useState, useMemo } from 'react';
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
  Plus,
  Tag,
  Receipt,
  X,
  Sparkles
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
import { FloatingChatbot } from '../components/FloatingChatbot';

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

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    description: 'TechCorp Engineering Salary',
    category: 'Salary',
    spentFor: 'Monthly Engineering Payroll Credit',
    date: 'Today, 09:30 AM',
    amount: 5200.00,
    type: 'INCOME'
  },
  {
    id: 'tx-2',
    description: 'Le Bistro Central',
    category: 'Food & Dining',
    spentFor: 'Team Strategy Dinner with Clients',
    date: 'Yesterday, 08:15 PM',
    amount: 148.50,
    type: 'EXPENSE'
  },
  {
    id: 'tx-3',
    description: 'CyberNet ISP Broadband',
    category: 'Utilities',
    spentFor: 'High-speed Fiber Internet Subscription',
    date: 'Oct 04, 11:00 AM',
    amount: 125.00,
    type: 'EXPENSE'
  },
  {
    id: 'tx-4',
    description: 'Yubico Store',
    category: 'Shopping',
    spentFor: 'Hardware Security 2FA Keys',
    date: 'Oct 03, 04:20 PM',
    amount: 289.99,
    type: 'EXPENSE'
  },
  {
    id: 'tx-5',
    description: 'Vanguard Index Payout',
    category: 'Investment',
    spentFor: 'Quarterly S&P 500 Dividend Payout',
    date: 'Oct 02, 02:45 PM',
    amount: 340.50,
    type: 'INCOME'
  },
  {
    id: 'tx-6',
    description: 'Artisan Cafe & Bakery',
    category: 'Food & Dining',
    spentFor: 'Specialty Coffee & Breakfast Meeting',
    date: 'Oct 01, 09:00 AM',
    amount: 14.50,
    type: 'EXPENSE'
  },
  {
    id: 'tx-7',
    description: 'Transit Authority Rails',
    category: 'Travel',
    spentFor: 'Airport Express Metro Rail Pass',
    date: 'Sep 30, 01:15 PM',
    amount: 62.40,
    type: 'EXPENSE'
  }
];

export const DashboardPage = ({ transactions, summary, onRefresh, onTriggerAnomaly }) => {
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // User transaction list with localStorage persistence
  const [txList, setTxList] = useState(() => {
    try {
      const saved = localStorage.getItem('finsec_dashboard_txs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return transactions && transactions.length > 0 ? transactions : INITIAL_TRANSACTIONS;
  });

  // Manual Transaction Form state
  const [addForm, setAddForm] = useState({
    spentFor: '',
    merchant: '',
    amount: '',
    category: 'Food & Dining',
    type: 'EXPENSE'
  });

  const [receiptsList, setReceiptsList] = useState([
    { id: 'rec-1', title: 'Salary Credited', amount: '₹5,000.00', category: 'Salary' },
    { id: 'rec-2', title: 'Consulting Service', amount: '₹593.00', category: 'Service' },
    { id: 'rec-3', title: 'Rent or Mortgage', amount: '₹3,030.98', category: 'Rent' }
  ]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Dynamic balance calculations based on transactions
  const calculatedTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    txList.forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === 'INCOME') income += amt;
      else expense += amt;
    });
    return {
      balance: (income - expense).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      income: income.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      expense: expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    };
  }, [txList]);

  // "Simulate Bank Sync" button click
  const handleTestAnomaly = () => {
    setSimulating(true);

    bankApi
      .simulateWebhook({
        amount: 50000.0,
        merchant: 'Moscow High Security Hub',
        location: 'Moscow, Russia',
        category: 'Shopping',
        timestamp: new Date().toISOString()
      })
      .catch((e) => {
        console.warn('Backend webhook fallback to local state:', e);
      });

    // Anomaly Modal pops up in 700ms for demo
    setTimeout(() => {
      setSimulating(false);
      if (onTriggerAnomaly) {
        onTriggerAnomaly({
          message: '⚠️ Suspicious Transaction Detected: ₹50,000 at 3:00 AM in Russia. Approve or Block?',
          reason: 'Amount (₹50,000) is >3x user 30-day average; Location is geographically impossible (Moscow, Russia)',
          transaction: {
            id: 'mock-tx-' + Date.now(),
            amount: 50000.0,
            merchant: 'Moscow High Security Hub',
            location: 'Moscow, Russia',
            date: new Date().toISOString()
          }
        });
      }
    }, 700);
  };

  // Handle manual transaction submit
  const handleAddTransactionSubmit = (e) => {
    e.preventDefault();
    if (!addForm.spentFor.trim() || !addForm.amount) return;

    const numAmount = parseFloat(addForm.amount) || 0;
    const newTx = {
      id: 'tx-' + Date.now(),
      description: addForm.merchant.trim() || addForm.spentFor.trim(),
      spentFor: addForm.spentFor.trim(),
      category: addForm.category,
      amount: numAmount,
      type: addForm.type,
      date: 'Just now'
    };

    const updated = [newTx, ...txList];
    setTxList(updated);
    try {
      localStorage.setItem('finsec_dashboard_txs', JSON.stringify(updated));
    } catch (err) {}

    setIsAddModalOpen(false);
    setAddForm({
      spentFor: '',
      merchant: '',
      amount: '',
      category: 'Food & Dining',
      type: 'EXPENSE'
    });
    showToast(`Added: ₹${numAmount.toLocaleString('en-IN')} for "${newTx.spentFor}"`);
  };

  const handleReceiptSuccess = (newReceipt) => {
    if (newReceipt) {
      const amt = parseFloat(newReceipt.amount || 450);
      setReceiptsList((prev) => [
        {
          id: 'rec-' + Date.now(),
          title: newReceipt.merchant || 'AI Scanned Merchant',
          amount: `₹${amt.toFixed(2)}`,
          category: newReceipt.category || 'Shopping'
        },
        ...prev
      ]);

      // Automatically add as an expense transaction too!
      const newTx = {
        id: 'tx-' + Date.now(),
        description: newReceipt.merchant || 'OCR Scanned Receipt',
        spentFor: `Receipt scan at ${newReceipt.merchant || 'Merchant'}`,
        category: newReceipt.category || 'Shopping',
        amount: amt,
        type: 'EXPENSE',
        date: 'Just now'
      };
      setTxList((prev) => {
        const up = [newTx, ...prev];
        try {
          localStorage.setItem('finsec_dashboard_txs', JSON.stringify(up));
        } catch (e) {}
        return up;
      });
      showToast(`Receipt Scanned: ₹${amt.toFixed(2)} added to ledger`);
    }
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-3 duration-200">
          <div className="px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center space-x-2 text-white bg-emerald-600 border-emerald-500 shadow-emerald-600/30">
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header with Title and Simulate Bank Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live cryptographically-chained financial account & spending ledger</p>
        </div>

        {/* Action Buttons: Manual Add Transaction & Simulate Bank Sync */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          <button
            onClick={handleTestAnomaly}
            disabled={simulating}
            className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 shadow-sm active:scale-95 transition-all flex items-center space-x-2"
          >
            <Play className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Simulating...' : 'Simulate Bank Sync'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout matching reference design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Middle Column (Cols 1-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Row 1: Virtual Card & Wallet Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Virtual Debit Card */}
            <div className="h-48 rounded-3xl bg-gradient-to-br from-indigo-100 via-blue-100 to-indigo-200 p-6 flex flex-col justify-between shadow-sm border border-indigo-200/50 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                  ZeroTrust Debit
                </span>
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
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Cardholder</p>
                  <p className="text-xs font-bold text-slate-800">Gadiel Machado</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold text-right">Expires</p>
                  <p className="text-xs font-bold text-slate-800">12/28</p>
                </div>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="h-48 rounded-3xl bg-white p-6 flex flex-col justify-between shadow-sm border border-slate-200/80">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Balance</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">₹{calculatedTotals.balance}</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    title="Add Transaction"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleTestAnomaly}
                    className="p-2 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Simulate Bank Sync"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Total Income</p>
                    <p className="text-xs font-bold text-slate-800">₹{calculatedTotals.income}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Total Expenses</p>
                    <p className="text-xs font-bold text-slate-800">₹{calculatedTotals.expense}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Transactions & Monthly Earnings Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Transactions List */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Recent Transactions</h4>
                  <p className="text-[10px] text-slate-400">{txList.length} total entries recorded</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {txList.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {tx.spentFor || tx.description}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] font-medium text-slate-400">
                              {tx.category}
                            </span>
                            <span className="text-[9px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{tx.date}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs font-black shrink-0 ml-2 ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Earnings Chart & Donut Chart */}
            <div className="space-y-6">
              {/* Line Graph */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Monthly earnings
                  </h4>
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
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
                  Earnings
                </h4>
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
                    <span className="text-xs font-black text-slate-900">₹{calculatedTotals.balance}</span>
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
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Receipt</span>
              </button>
            </div>

            <div className="space-y-3">
              {receiptsList.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-white text-slate-700 shadow-sm">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rec.amount}</p>
                      <p className="text-[10px] text-slate-400">{rec.title}</p>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Floating Chatbot Assistant */}
      <FloatingChatbot />

      {/* Modal for Receipt Upload */}
      <ReceiptScannerModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onSuccess={handleReceiptSuccess}
      />

      {/* MANUAL ADD TRANSACTION MODAL (For live judge demo) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add New Transaction</h3>
                  <p className="text-xs text-slate-500">Record spending details for the live demo</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddTransactionSubmit} className="p-6 space-y-4 text-left">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, type: 'EXPENSE' })}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      addForm.type === 'EXPENSE'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Expense (Debited)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddForm({ ...addForm, type: 'INCOME' })}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      addForm.type === 'INCOME'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Income (Credited)
                  </button>
                </div>
              </div>

              {/* What was it spent for */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  What was it spent for? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Client Dinner, AWS Cloud Hosting, Groceries"
                  value={addForm.spentFor}
                  onChange={(e) => setAddForm({ ...addForm, spentFor: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount in ₹ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g., 1450.00"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold cursor-pointer"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Salary">Salary</option>
                  <option value="Investment">Investment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Merchant / Vendor (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Merchant / Payee <span className="text-slate-400 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Starbucks, Amazon, Apple"
                  value={addForm.merchant}
                  onChange={(e) => setAddForm({ ...addForm, merchant: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Add to Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
