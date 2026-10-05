import React from 'react';
import {
  Shield,
  Lock,
  Activity,
  User,
  Key,
  LogOut,
  Sliders,
  AlertTriangle,
  FileText,
  DollarSign,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth, onOpenProfile, onOpenPasskey, alertCount }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                FinSec <span className="text-cyan-400 font-mono font-normal text-sm px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">ZeroTrust</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
              <span>PS-01 FinTrack</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> FIDO2 / HMAC Shield
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'budgets'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Budgets & Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_receipts')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'ai_receipts'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Receipt Vision & AI</span>
          </button>

          {/* SOC Tab - Visible to All for demo, but highlights Admin Role */}
          <button
            onClick={() => setActiveTab('soc')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all relative ${
              activeTab === 'soc'
                ? 'bg-red-500/15 text-red-300 border border-red-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 text-red-400" />
            <span>SOC Threat Center</span>
            {user?.role === 'ADMIN' && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-mono">
                ADMIN
              </span>
            )}
            {alertCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2.5">
              {/* Passkey Enroll Quick Button */}
              <button
                onClick={onOpenPasskey}
                title="Enroll Passkey (Biometric / Security Key)"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-cyan-400 font-mono transition-all"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Passkey</span>
              </button>

              {/* Profile Settings */}
              <button
                onClick={onOpenProfile}
                title="Profile & Custom Gemini API Key"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline font-medium">{user.fullName || user.email.split('@')[0]}</span>
                {user.role === 'ADMIN' && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/50">
                    Admin
                  </span>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700/60 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In / Passkey</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
