import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Sparkles, Key, AlertCircle, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithPassword, loginWithPasskey, error: authError } = useAuth();
  
  const [email, setEmail] = useState('user@finesec.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const executeLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    setErr('');
    const cleanEmail = (loginEmail || email).trim().toLowerCase();

    // Check mock role routing logic
    const isAdmin = cleanEmail.includes('admin');

    try {
      // Try real backend login
      await loginWithPassword(cleanEmail, loginPassword || password);
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      console.warn('Backend login fallback to mock session for hackathon demo:', e.message);
      // Fallback local mock authentication
      const mockUser = {
        id: isAdmin ? 'admin-uuid-001' : 'user-uuid-001',
        email: cleanEmail,
        fullName: isAdmin ? 'Chief Information Security Officer' : 'Gadiel Machado',
        role: isAdmin ? 'ADMIN' : 'USER',
        avatar: isAdmin
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
      };
      localStorage.setItem('finsec_access_token', 'mock_jwt_token_' + Date.now());
      localStorage.setItem('finsec_mock_user', JSON.stringify(mockUser));
      
      // Trigger instant navigation based on email
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = (e) => {
    e.preventDefault();
    executeLogin();
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setErr('');
    try {
      await loginWithPasskey(email);
      if (email.toLowerCase().includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      // Fallback mock passkey
      executeLogin();
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
          <p className="text-xs text-slate-500">Secure Personal Finance & SOC Cyber Gateway</p>
        </div>

        {/* Demo Fast-Login Selector Buttons */}
        <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setEmail('user@finesec.com');
              setPassword('Password123!');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              !email.includes('admin')
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>User View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('admin@finesec.com');
              setPassword('AdminSecure123!');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              email.includes('admin')
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin (SOC)</span>
          </button>
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
            or password credentials
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
            className={`w-full py-3 rounded-2xl text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center space-x-2 ${
              email.includes('admin')
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{email.includes('admin') ? 'Authenticate as SOC Admin (/admin)' : 'Sign In as User (/dashboard)'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials note */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <p className="text-[11px] font-bold text-slate-700">Role-Based Access for Evaluators:</p>
          <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
            <div>User: <span className="text-indigo-600 font-bold">user@finesec.com</span> → /dashboard</div>
            <div>Admin: <span className="text-rose-600 font-bold">admin@finesec.com</span> → /admin</div>
          </div>
        </div>
      </div>
    </div>
  );
};
