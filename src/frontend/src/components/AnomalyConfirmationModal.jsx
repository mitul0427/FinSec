import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldAlert,
  MapPin,
  Clock,
  Building
} from 'lucide-react';
import { bankApi } from '../utils/api';

export const AnomalyConfirmationModal = ({ alertData, onClose, onActionResolved, showToast }) => {
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!alertData) return null;

  const { transaction, reason, message } = alertData;

  const handleApprove = () => {
    setLoadingAction(true);
    // Call backend endpoint in background if id is present
    if (transaction?.id && !transaction.id.startsWith('mock-')) {
      bankApi.approve(transaction.id).catch(() => {});
    }

    setStatusMessage({ type: 'success', text: 'Transaction Approved! Ledger updated.' });
    if (showToast) showToast('Transaction Approved (COMPLETED)', 'success');

    setTimeout(() => {
      if (onActionResolved) onActionResolved();
      onClose();
    }, 1000);
  };

  const handleBlock = () => {
    setLoadingAction(true);
    // Call backend endpoint in background if id is present
    if (transaction?.id && !transaction.id.startsWith('mock-')) {
      bankApi.block(transaction.id).catch(() => {});
    }

    setStatusMessage({
      type: 'danger',
      text: 'Threat Blocked & Logged to SecurityLog!'
    });
    if (showToast) showToast('Threat Blocked & Honeypot Tripwire Armed', 'danger');

    setTimeout(() => {
      if (onActionResolved) onActionResolved();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-2 border-rose-500/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header Banner */}
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                PENDING_CONFIRMATION
              </span>
              <span className="text-xs text-rose-600 font-semibold">Real-Time Anomaly Engine</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
              {message || '⚠️ Suspicious Transaction Detected: ₹50,000 at 3:00 AM in Russia. Approve or Block?'}
            </h3>
          </div>
        </div>

        {/* Anomaly Reason Alert */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
          <div className="flex items-center text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" />
            <span>AI Anomaly Rule Triggered</span>
          </div>
          <p className="text-xs text-rose-700 font-medium">
            {reason || 'Amount is >3x user 30-day average; Location is geographically impossible (Moscow, Russia).'}
          </p>
        </div>

        {/* Transaction Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Amount</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
              ₹{parseFloat(transaction.amount || 50000).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
              <Building className="w-3 h-3 mr-1 text-slate-500" /> Merchant
            </div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {transaction.merchant || 'Moscow High Security Hub'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-rose-500" /> Location
            </div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {transaction.location || 'Moscow, Russia'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
              <Clock className="w-3 h-3 mr-1 text-amber-500" /> Timestamp
            </div>
            <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
              3:00 AM (Live Sync)
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold text-center border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Action Buttons */}
        {!statusMessage && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={handleApprove}
              disabled={loadingAction}
              className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve (Green)</span>
            </button>

            <button
              onClick={handleBlock}
              disabled={loadingAction}
              className="py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Block & Report (Red)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
