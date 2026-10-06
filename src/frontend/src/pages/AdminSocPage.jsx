import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  Radio,
  Lock,
  RefreshCw,
  Crosshair,
  AlertTriangle,
  Globe,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { socApi } from '../utils/api';

const MOCK_SECURITY_LOGS = [
  { id: 'sec-1', timestamp: '11:34:12 AM', ip: '185.220.101.5', attackType: 'SQL Injection (-- OR 1=1)', status: 'Blocked', severity: 'CRITICAL', location: 'Moscow, Russia' },
  { id: 'sec-2', timestamp: '11:32:05 AM', ip: '198.51.100.42', attackType: 'Honeypot Decoy Probe (/api/admin/login-v1)', status: 'Banned', severity: 'CRITICAL', location: 'Frankfurt, Germany' },
  { id: 'sec-3', timestamp: '11:28:49 AM', ip: '103.245.236.1', attackType: 'IDOR Resource Tamper Attempt', status: 'Blocked', severity: 'HIGH', location: 'Beijing, China' },
  { id: 'sec-4', timestamp: '11:22:10 AM', ip: '45.154.255.89', attackType: 'Cross-Site Scripting (<script> polyglot)', status: 'Blocked', severity: 'HIGH', location: 'St. Petersburg, Russia' },
  { id: 'sec-5', timestamp: '11:15:33 AM', ip: '194.26.29.112', attackType: 'HMAC Signature Tampering', status: 'Blocked', severity: 'CRITICAL', location: 'Amsterdam, Netherlands' },
  { id: 'sec-6', timestamp: '11:05:01 AM', ip: '109.248.206.18', attackType: 'Rate Limit Exhaustion Attack (DoS)', status: 'Blocked', severity: 'MEDIUM', location: 'Kyiv, Ukraine' }
];

export const AdminSocPage = () => {
  const [logs, setLogs] = useState(MOCK_SECURITY_LOGS);
  const [simulating, setSimulating] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);

  const handleSimulateAttack = (type = 'HONEYPOT_TRIGGER') => {
    setSimulating(true);
    setTimeout(() => {
      const newEntry = {
        id: 'sec-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        ip: `${Math.floor(Math.random() * 150 + 40)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.77`,
        attackType: type === 'HONEYPOT_TRIGGER' ? 'Honeypot Trap Triggered (/api/admin/login-v1)' : 'SQL Injection Attack Blocked',
        status: 'Blocked',
        severity: 'CRITICAL',
        location: 'Moscow, Russia'
      };
      setLogs((prev) => [newEntry, ...prev]);
      setActiveIncident(newEntry);
      setSimulating(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600">
              Live ZeroTrust Defense Center
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            SOC Threat Map & Immutable Audit Engine
          </h2>
        </div>

        {/* Live Attack Simulator Trigger Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSimulateAttack('SQLI_ATTEMPT')}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate SQLi</span>
          </button>

          <button
            onClick={() => handleSimulateAttack('HONEYPOT_TRIGGER')}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center space-x-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Trip Honeypot</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Attacks Blocked</p>
          <p className="text-2xl font-black text-slate-900 mt-1">1,429</p>
          <span className="text-[10px] text-emerald-600 font-bold">100% Intercepted</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Honeypot Decoy Hits</p>
          <p className="text-2xl font-black text-rose-600 mt-1">42</p>
          <span className="text-[10px] text-rose-500 font-mono">Banned IP List Active</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">SQLi Regex Filters</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">108</p>
          <span className="text-[10px] text-indigo-500 font-mono">AST Body Inspector</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Audit Immutability</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">VERIFIED</p>
          <span className="text-[10px] text-slate-500 font-mono">Prisma Append-Only</span>
        </div>
      </div>

      {/* Grid: Live Interactive Threat Map & Threat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* World Threat Map (Cols 1-7) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Global Threat Ingress Vector (Real-Time)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
              LIVE DEFENSE RADAR
            </span>
          </div>

          {/* Map Graphic with Pulsing Red Attack Vector Coordinates */}
          <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-[#0c1527] border border-slate-800 flex items-center justify-center">
            {/* World Map SVG Silhouette */}
            <svg
              className="w-full h-full opacity-35 object-contain"
              viewBox="0 0 1000 500"
              fill="currentColor"
            >
              <path
                d="M150,150 Q180,100 260,120 T350,180 T250,300 T180,280 Z M450,120 Q550,80 650,130 T800,160 T850,280 T700,320 T550,280 Z M650,350 Q750,330 850,420 T750,480 Z M200,340 Q250,320 320,400 T260,480 Z"
                className="text-slate-600"
              />
              {/* Grid lines */}
              <line x1="0" y1="250" x2="1000" y2="250" stroke="#1e293b" strokeDasharray="4" />
              <line x1="500" y1="0" x2="500" y2="500" stroke="#1e293b" strokeDasharray="4" />
            </svg>

            {/* Target 1: Moscow, Russia Threat Pulse */}
            <div className="absolute top-[28%] left-[62%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-rose-500 opacity-75 radar-ping"></span>
              <span className="relative w-3.5 h-3.5 bg-rose-600 rounded-full border-2 border-white shadow-lg cursor-pointer"></span>
              <div className="absolute bottom-5 bg-slate-900/90 text-rose-300 border border-rose-800 text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap">
                Moscow [185.220.101.5] - SQLi Blocked
              </div>
            </div>

            {/* Target 2: Frankfurt, Germany Honeypot Pulse */}
            <div className="absolute top-[34%] left-[49%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-amber-500 opacity-75 radar-ping"></span>
              <span className="relative w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white shadow-lg cursor-pointer"></span>
              <div className="absolute top-5 bg-slate-900/90 text-amber-300 border border-amber-800 text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap">
                Frankfurt - Decoy Probe Banned
              </div>
            </div>

            {/* Target 3: User Base (Hyderabad, India) Protected Core */}
            <div className="absolute top-[48%] left-[68%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="absolute w-6 h-6 rounded-full bg-emerald-500 opacity-40 animate-ping"></span>
              <span className="relative w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></span>
              <div className="absolute bottom-4 bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                Protected Core: Hyderabad
              </div>
            </div>

            {/* Ingress Attack Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1="62%"
                y1="28%"
                x2="68%"
                y2="48%"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4"
                className="animate-pulse"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>Filter: OWASP Top 10 + Honeypot Decoys</span>
            <span className="text-emerald-400 font-semibold">Active Defenses: 100% ONLINE</span>
          </div>
        </div>

        {/* Immutable Security Logs Table (Cols 8-12) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Immutable Security Logs</h3>
              <p className="text-[11px] text-slate-400">Append-Only Cryptographic Audit Trail</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              PostgreSQL / Prisma
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[9px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Attack Vector</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{log.ip}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate" title={log.attackType}>
                      {log.attackType}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
