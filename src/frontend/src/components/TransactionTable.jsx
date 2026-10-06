import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { sanitizePlain } from '../utils/sanitize';
import { transactionApi } from '../utils/api';

const CATEGORIES = [
  'Food & Dining',
  'Housing',
  'Utilities',
  'Shopping',
  'Travel',
  'Healthcare',
  'Salary',
  'Investment',
  'Entertainment',
  'Other'
];

export const TransactionTable = ({
  transactions,
  loading,
  filters,
  setFilters,
  onRefresh,
  onOpenAddModal
}) => {
  const [exporting, setExporting] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to securely delete this transaction?')) return;
    try {
      await transactionApi.delete(id);
      onRefresh();
    } catch (err) {
      alert('Failed to delete transaction.');
    }
  };

  const handleDownloadExport = (format = 'csv') => {
    setExporting(true);
    const token = localStorage.getItem('finsec_access_token');
    const url = `/api/v1/transactions/export?format=${format}`;

    // Direct browser download via fetch with bearer token
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `fintrack_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setExporting(false);
      })
      .catch((e) => {
        console.error(e);
        alert('Export failed.');
        setExporting(false);
      });
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-100">Financial Ledger</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1 inline" /> HMAC Protected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable transaction records signed with SHA-256 integrity tokens
          </p>
        </div>

        {/* Action Buttons: Add & Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownloadExport('csv')}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-all"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={() => handleDownloadExport('json')}
            disabled={exporting}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-all"
            title="Download JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/40 p-4 border-b border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search merchant or description..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={filters.category || ''}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Transaction Types</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expense Only</option>
          </select>
        </div>

        {/* Start Date */}
        <div className="relative">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description / Merchant</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full mr-2"></div>
                  Verifying ledger signatures...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No matching transactions located in encrypted store.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {t.type === 'INCOME' ? (
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                        <ArrowDownLeft className="w-3 h-3 mr-0.5" /> Income
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/40">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> Expense
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-300 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60">
                      {sanitizePlain(t.category)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    <div className="font-medium flex items-center space-x-2">
                      <span>{sanitizePlain(t.description)}</span>
                      {t.status === 'PENDING_CONFIRMATION' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          ON HOLD
                        </span>
                      )}
                      {t.status === 'BLOCKED' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          BLOCKED
                        </span>
                      )}
                    </div>
                    {t.merchant && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        {sanitizePlain(t.merchant)} {t.location ? `• ${sanitizePlain(t.location)}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                    <span className={t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}>
                      {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
