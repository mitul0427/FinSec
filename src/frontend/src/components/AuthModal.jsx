import React, { useState } from 'react';
import { Lock, Key, Mail, Shield, AlertTriangle, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ isOpen, onClose }) => {
  const { loginWithPassword, registerUser, loginWithPasskey, error } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      if (isRegister) {
        await registerUser(email, password, fullName, role);
      } else {
        await loginWithPassword(email, password);
      }
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await loginWithPasskey(email);
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Passkey login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full border border-cyan-500/30 shadow-2xl relative">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {isRegister ? 'Create FinSec Account' : 'Zero Trust Ingress Gateway'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister
              ? 'Register with FIDO2 / WebAuthn cryptographic identity'
              : 'Authenticate using Passkey Biometrics or 5-min Ephemeral JWT'}
          </p>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Passkey Fast Login (Passwordless) */}
        {!isRegister && (
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Authenticate with WebAuthn Passkey</span>
            </button>
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-mono uppercase tracking-wider relative">
                Or Use Password
              </span>
            </div>
          </div>
        )}

        {/* Traditional Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Vance"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@finsec.local"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Master Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role Permission</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="USER">Standard User (FinTrack Consumer)</option>
                <option value="ADMIN">SOC Security Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Create Encrypted Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>Sign In with Password</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        {!isRegister && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">Quick Demo Accounts:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@finsec.local');
                  setPassword('Admin@Secure2026!');
                }}
                className="flex-1 py-1 px-2 rounded bg-slate-900 border border-slate-800 hover:border-red-500/50 text-[10px] text-red-300 font-mono truncate"
              >
                Admin (SOC Access)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('demo@finsec.local');
                  setPassword('Demo@Secure2026!');
                }}
                className="flex-1 py-1 px-2 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-cyan-300 font-mono truncate"
              >
                Demo (Personal Finance)
              </button>
            </div>
          </div>
        )}

        {/* Toggle Register / Login */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setLocalError(null);
            }}
            className="text-xs text-cyan-400 hover:underline font-medium"
          >
            {isRegister
              ? 'Already registered? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-sm p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
