import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Flame,
  Terminal,
  Globe,
  Radio,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Users,
  ShieldCheck,
  ChevronDown,
  Activity,
  Crosshair
} from 'lucide-react';

const INITIAL_LOGS = [
  { id: 1, ip: '185.220.101.5', type: 'SQL Injection', status: 'Blocked', time: '11:34:12 AM' },
  { id: 2, ip: '198.51.100.42', type: 'Honeypot Triggered', status: 'Banned', time: '11:32:05 AM' },
  { id: 3, ip: '103.245.236.1', type: 'IDOR Resource Tamper', status: 'Blocked', time: '11:28:49 AM' },
  { id: 4, ip: '45.154.255.89', type: 'Cross-Site Scripting (XSS)', status: 'Blocked', time: '11:22:10 AM' }
];

const INITIAL_MARKERS = [
  { id: 'init-1', x: 68, y: 46, label: 'Protected Core Gateway (Hyderabad, India)' },
  { id: 'init-2', x: 50, y: 30, label: 'Frankfurt Decoy Honeypot Trap' }
];

// TASK 3: Realistic Dummy Data for Admin Platform Users Table
const INITIAL_PLATFORM_USERS = [
  { id: 'USR-001', name: 'Gadiel Machado', email: 'gadiel@example.com', balance: '₹4,523.98', status: 'Active', ip: '192.168.1.10', role: 'User', lastLogin: '2 mins ago' },
  { id: 'USR-002', name: 'John Doe', email: 'john@example.com', balance: '₹12,050.00', status: 'Flagged', ip: '10.0.0.45', role: 'User', lastLogin: '14 mins ago' },
  { id: 'USR-003', name: 'Alice Johnson', email: 'alice@example.com', balance: '₹89,200.50', status: 'Active', ip: '172.16.0.22', role: 'Merchant', lastLogin: 'Just now' },
  { id: 'USR-004', name: 'Rahul Sharma', email: 'rahul.s@techfin.in', balance: '₹1,45,200.00', status: 'Active', ip: '103.245.236.14', role: 'User', lastLogin: '42 mins ago' },
  { id: 'USR-005', name: 'Elena Rostova', email: 'elena@cyberdef.org', balance: '₹34,180.75', status: 'Active', ip: '45.154.255.99', role: 'Analyst', lastLogin: '6 mins ago' },
  { id: 'USR-006', name: 'David Miller', email: 'david.m@apexholdings.com', balance: '₹2,300.00', status: 'Flagged', ip: '198.51.100.77', role: 'User', lastLogin: '28 mins ago' },
  { id: 'USR-007', name: 'Priya Patel', email: 'priya.patel@vbit.ac.in', balance: '₹67,890.20', status: 'Active', ip: '182.74.89.12', role: 'User', lastLogin: '11 mins ago' },
  { id: 'USR-008', name: 'Marcus Vance', email: 'mvance@shadowtraders.io', balance: '₹5,10,000.00', status: 'Flagged', ip: '185.220.101.99', role: 'Trader', lastLogin: '35 mins ago' },
  { id: 'USR-009', name: 'Sophia Zhang', email: 'sophia.z@asiafin.cn', balance: '₹92,450.00', status: 'Active', ip: '124.108.22.4', role: 'User', lastLogin: '1 hour ago' },
  { id: 'USR-010', name: 'Karthik Rao', email: 'karthik.rao@hydsec.in', balance: '₹18,740.10', status: 'Active', ip: '49.207.211.83', role: 'User', lastLogin: '50 mins ago' },
  { id: 'USR-011', name: 'Liam O\'Connor', email: 'liam@dublinfintech.ie', balance: '₹44,300.50', status: 'Active', ip: '89.101.240.12', role: 'User', lastLogin: '19 mins ago' },
  { id: 'USR-012', name: 'Chloe Dubois', email: 'chloe.d@parisfin.fr', balance: '₹8,920.00', status: 'Flagged', ip: '195.154.122.30', role: 'User', lastLogin: '3 hours ago' },
  { id: 'USR-013', name: 'Aarav Gupta', email: 'aarav.g@zerotrust.dev', balance: '₹1,20,500.00', status: 'Active', ip: '14.139.69.18', role: 'User', lastLogin: '22 mins ago' },
  { id: 'USR-014', name: 'Sara Al-Mansoor', email: 'sara.m@gulfcapital.ae', balance: '₹3,40,900.00', status: 'Active', ip: '86.96.21.5', role: 'User', lastLogin: '58 mins ago' }
];

export const AdminSocPage = () => {
  const [threatLogs, setThreatLogs] = useState(INITIAL_LOGS);
  const [mapMarkers, setMapMarkers] = useState(INITIAL_MARKERS);
  const [users, setUsers] = useState(INITIAL_PLATFORM_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);

  const showNotification = (msg, isDanger = false) => {
    setToast({ msg, isDanger });
    setTimeout(() => setToast(null), 3500);
  };

  // Handler 1: Simulate SQLi
  const handleSimulateSQLi = () => {
    const timeStr = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now(),
      ip: '192.168.1.55',
      type: 'SQL Injection',
      status: 'Blocked',
      time: timeStr
    };

    const newMarker = {
      id: 'sqli-' + Date.now(),
      x: 27, // New York region on map
      y: 35,
      label: 'SQL Injection Blocked (192.168.1.55 - New York)'
    };

    setThreatLogs((prev) => [newLog, ...prev]);
    setMapMarkers((prev) => [...prev, newMarker]);
    showNotification('SQLi Attack Blocked!');
  };

  // Handler 2: Trip Honeypot
  const handleTripHoneypot = () => {
    const timeStr = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now(),
      ip: '10.0.0.12',
      type: 'Honeypot Triggered',
      status: 'Banned',
      time: timeStr
    };

    const newMarker = {
      id: 'honey-' + Date.now(),
      x: 58, // Moscow region on map
      y: 25,
      label: 'Honeypot Trap Triggered - IP Banned (10.0.0.12 - Moscow)'
    };

    setThreatLogs((prev) => [newLog, ...prev]);
    setMapMarkers((prev) => [...prev, newMarker]);
    showNotification('Attacker IP Banned!', true);
  };

  // Toggle user status (Active <-> Flagged)
  const handleToggleStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'Active' ? 'Flagged' : 'Active';
          showNotification(
            `User ${u.id} status changed to ${newStatus}`,
            newStatus === 'Flagged'
          );
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.ip.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, searchQuery, statusFilter]);

  const activeCount = users.filter((u) => u.status === 'Active').length;
  const flaggedCount = users.filter((u) => u.status === 'Flagged').length;

  return (
    <div className="space-y-8 relative pb-12">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center space-x-2 text-white ${
              toast.isDanger
                ? 'bg-rose-600 border-rose-500 shadow-rose-600/30'
                : 'bg-emerald-600 border-emerald-500 shadow-emerald-600/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600">
              SOC Command Center • RBAC Admin View
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Security Operations & Platform User Governance
          </h2>
        </div>

        {/* Buttons: Wire up Simulate SQLi & Trip Honeypot */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSimulateSQLi}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 active:scale-95 transition-all flex items-center space-x-2"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate SQLi</span>
          </button>

          <button
            onClick={handleTripHoneypot}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center space-x-2"
          >
            <Flame className="w-3.5 h-3.5 text-white" />
            <span>Trip Honeypot</span>
          </button>
        </div>
      </div>

      {/* TOP SECTION: Ultra-Reliable Cyber Threat Radar Canvas */}
      <div className="bg-slate-950 rounded-3xl p-5 shadow-2xl border border-slate-800 space-y-3 text-white">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Global Cyber Threat Radar
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800 font-bold">
              {mapMarkers.length} Active Targets
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>GRID LIVE</span>
            </span>
          </div>
        </div>

        {/* Map Container with High-Tech Dark Cyber Grid & Red Radar Dots */}
        <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-slate-800 relative bg-[#090d16] flex items-center justify-center">
          {/* Subtle Cyber Radar Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
          <div className="absolute inset-0 border border-slate-800/40 pointer-events-none"></div>

          {/* World Map SVG Outline in Cyber Neon */}
          <svg
            className="w-full h-full object-cover opacity-30 pointer-events-none"
            viewBox="0 0 1000 500"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
          >
            {/* Americas */}
            <path d="M150,100 Q200,80 250,120 T300,180 T250,250 T280,320 T240,420 T200,350 T180,220 Z" />
            {/* Europe & Africa */}
            <path d="M480,80 Q520,60 550,110 T520,180 T560,260 T520,380 T460,320 T480,200 Z" />
            {/* Asia & Australia */}
            <path d="M620,80 Q750,70 820,140 T880,220 T780,280 T800,380 T720,320 T650,200 Z" />
          </svg>

          {/* Coordinate Crosshairs */}
          <div className="absolute top-4 left-4 text-[10px] font-mono text-cyan-400/80 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            RADAR: HYDERABAD-FRANKFURT-GLOBAL [20.59° N, 78.96° E]
          </div>

          {/* Dynamic Radar Threat Blips */}
          {mapMarkers.map((marker) => (
            <div
              key={marker.id}
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
            >
              {/* Outer Pulsing Ring */}
              <span className="absolute -inset-3 rounded-full bg-rose-500/40 animate-ping"></span>
              {/* Core Threat Dot */}
              <span className="relative flex h-4 w-4 rounded-full bg-rose-600 border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.8)] items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
              {/* Tooltip on Hover / Pin */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-white border border-rose-500/50 px-3 py-1.5 rounded-xl text-[10px] font-mono shadow-xl transition-all pointer-events-none group-hover:scale-105">
                <p className="font-bold text-rose-400 uppercase">⚠ Threat Blocked</p>
                <p className="text-slate-200">{marker.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP SECTION: Security Logs Table mapping over threatLogs */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Security Audit Logs</h3>
            <p className="text-[11px] text-slate-400">Live stream of intercepted security events</p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Total Events: {threatLogs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Attack Type</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {threatLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.time}</td>
                  <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{log.ip}</td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">{log.type}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        log.status === 'Blocked'
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM SECTION: "Platform Users" Data Table */}
      <div id="users-table" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Platform Users</h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {users.length} Registered
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live enterprise directory with account balances, threat status, and last known ingress IPs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeCount} Active</span>
            </span>
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{flaggedCount} Flagged</span>
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by User ID, Name, Email, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <label className="text-xs font-bold text-slate-600 shrink-0">Filter Status:</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Statuses ({users.length})</option>
                <option value="Active">Active ({activeCount})</option>
                <option value="Flagged">Flagged ({flaggedCount})</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-right">Account Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Last Login IP</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No users match "{searchQuery}" under status "{statusFilter}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isFlagged = u.status === 'Flagged';
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isFlagged ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                          {u.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${
                              isFlagged ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-slate-900 leading-tight">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{u.role}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-mono">
                          {u.balance}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm active:scale-95 ${
                            isFlagged
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {isFlagged ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Flagged</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap text-xs">
                        {u.ip}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                            isFlagged
                              ? 'text-emerald-700 bg-white border-emerald-200 hover:bg-emerald-50'
                              : 'text-rose-700 bg-white border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          {isFlagged ? 'Clear Flag' : 'Flag User'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
