import React from 'react';
import { Search, MessageSquare, Bell } from 'lucide-react';

export const TopBar = ({ alertCount = 0 }) => {
  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-slate-200/60 bg-white/50 backdrop-blur-md sticky top-0 z-30">
      {/* Search Input Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-slate-100/80 border-0 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Top Right Notification Icons */}
      <div className="flex items-center space-x-3">
        <button
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition-all shadow-sm relative"
          title="Chat Assistance"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition-all shadow-sm relative"
          title="Security Notifications"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
          ) : (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
          )}
        </button>
      </div>
    </header>
  );
};
