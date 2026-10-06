import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldAlert,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Info
} from 'lucide-react';
import { bankApi } from '../utils/api';

export const AnomalyConfirmationModal = ({ alertData, onClose, onActionResolved }) => {
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!alertData) return null;

  const { transaction, reason, message } = alertData;

  const handleApprove = async () => {
    setLoadingAction(true);
    try {
      const res = await bankApi.approve(transaction.id);
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Transaction approved! Balance deducted and ledger updated.' });
        setTimeout(() => {
          if (onActionResolved) onActionResolved();
          onClose();
        }, 1200);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to approve transaction.');
      }
    } catch (e) {
      alert('Error communicating with bank security service.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBlock = async () => {
    setLoadingAction(true);
    try {
      const res = await bankApi.block(transaction.id);
      if (res.ok) {
        setStatusMessage({
          type: 'danger',
          text: 'Transaction blocked! Logged to Immutable SecurityLog & Honeypot alert activated.'
        });
        setTimeout(() => {
          if (onActionResolved) onActionResolved();
          onClose();
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to block transaction.');
      }
    } catch (e) {
      alert('Error blocking transaction.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel-glow border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-rose-950/50">
        {/* Header Banner */}
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                PENDING_CONFIRMATION
              </span>
              <span className="text-xs text-rose-400 font-mono">Real-Time Anomaly Engine</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              {message || 'Suspicious transaction detected. Please confirm.'}
            </h3>
          </div>
        </div>

        {/* Anomaly Reason Alert */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-1.5">
          <div className="flex items-center text-xs font-semibold text-rose-300">
            <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-400" />
            <span>AI Anomaly Rule Triggered</span>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            {reason || 'Transaction exceeds typical spending profile or geographic baseline.'}
          </p>
        </div>

        {/* Transaction Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center">
              <DollarSign className="w-3 h-3 mr-1 text-emerald-400" /> Amount
            </div>
            <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">
              ${parseFloat(transaction.amount || 0).toFixed(2)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center">
              <Building className="w-3 h-3 mr-1 text-cyan-400" /> Merchant
            </div>
            <div className="text-sm font-semibold text-slate-100 truncate mt-0.5">
              {transaction.merchant || 'Unknown Merchant'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-rose-400" /> Location
            </div>
            <div className="text-xs font-medium text-slate-200 truncate mt-0.5">
              {transaction.location || 'Unknown Geo-Coordinate'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center">
              <Clock className="w-3 h-3 mr-1 text-amber-400" /> Timestamp
            </div>
            <div className="text-xs font-mono text-slate-300 mt-0.5">
              {new Date(transaction.date || transaction.createdAt || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold text-center border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
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
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve (Deduct Balance)</span>
            </button>

            <button
              onClick={handleBlock}
              disabled={loadingAction}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Block (Trigger Honeypot)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
