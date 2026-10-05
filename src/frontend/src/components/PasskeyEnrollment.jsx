import React, { useState } from 'react';
import { Key, ShieldCheck, CheckCircle, AlertTriangle, Fingerprint, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PasskeyEnrollment = ({ isOpen, onClose }) => {
  const { enrollPasskey, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);
    try {
      await enrollPasskey();
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Passkey enrollment failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full border border-cyan-500/30 shadow-2xl relative text-center">
        {/* Graphic */}
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
          <Fingerprint className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-slate-100">FIDO2 / WebAuthn Passkey</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Bind this physical device (Touch ID, Windows Hello, Face ID, or YubiKey hardware token) to your FinSec identity for unphishable passwordless logins.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-xs font-bold">Passkey Enrolled Successfully!</div>
            <p className="text-[11px] text-slate-300">
              Your device public key is registered in the Zero Trust store. You can now log in without passwords.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Waiting for Biometric Prompt...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Register This Device / Biometric</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
            >
              Cancel
            </button>
          </div>
        )}

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
