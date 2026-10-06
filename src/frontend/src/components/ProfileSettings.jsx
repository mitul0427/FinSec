import React, { useState } from 'react';
import { Sliders, Key, CheckCircle, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { sanitizePlain } from '../utils/sanitize';

export const ProfileSettings = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const updates = { fullName: sanitizePlain(fullName) };
      if (customGeminiKey.trim()) {
        updates.customGeminiKey = customGeminiKey.trim();
      }
      await updateProfile(updates);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full border border-cyan-500/30 shadow-2xl relative">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Identity & AI Settings</h3>
            <p className="text-xs text-slate-400">Configure your profile and custom Gemini AI keys</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Account</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                Custom Google Gemini API Key
              </label>
              <span className="text-[10px] text-slate-500">Optional</span>
            </div>
            <input
              type="password"
              value={customGeminiKey}
              onChange={(e) => setCustomGeminiKey(e.target.value)}
              placeholder={user?.customGeminiKey ? '•••••••••••••••• (Active)' : 'AIzaSy...'}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Used for Vision OCR receipt parsing and conversational financial assistant.
            </p>
          </div>

          {saved && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Profile settings successfully saved.</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
            >
              {saving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>

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
