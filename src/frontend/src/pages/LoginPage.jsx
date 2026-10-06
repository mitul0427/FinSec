import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Sparkles, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithPassword, loginWithPasskey, error: authError } = useAuth();
  
  const [email, setEmail] = useState('user@finsec.io');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await loginWithPassword(email, password);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setErr('');
    try {
      await loginWithPasskey(email);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.message || 'Passkey biometric verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-1">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">FinSec ZeroTrust</h1>
          <p className="text-xs text-slate-500">Secure Personal Finance & AI Defense Gateway</p>
        </div>

        {/* Error Banner */}
        {(err || authError) && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{err || authError}</span>
          </div>
        )}

        {/* Passkey Biometrics Option */}
        <button
          onClick={handlePasskeyLogin}
          disabled={loading}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <Key className="w-4 h-4 text-cyan-400" />
          <span>Sign In with WebAuthn Passkey (Biometrics)</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider shrink-0">
            or password login
          </span>
        </div>

        {/* Password Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to Financial Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <p className="text-[11px] font-bold text-slate-700">Judge / Evaluator Demo Account</p>
          <p className="text-[10px] text-slate-500 font-mono">user@finsec.io • Password123!</p>
        </div>
      </div>
    </div>
  );
};
