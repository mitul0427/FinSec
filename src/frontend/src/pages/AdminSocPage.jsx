import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
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
  UserCheck,
  UserX,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

// Fix for default Leaflet icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom pulsing red Leaflet DivIcon for live threat markers
const createPulsingRedIcon = (label) => {
  return L.divIcon({
    className: 'custom-leaflet-threat-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-left: -16px; margin-top: -16px;">
        <span style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: #ef4444; opacity: 0.75; animation: radar-pulse 2s infinite;"></span>
        <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: #dc2626; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const INITIAL_LOGS = [
  { id: 1, ip: '185.220.101.5', type: 'SQL Injection', status: 'Blocked', time: '11:34:12 AM' },
  { id: 2, ip: '198.51.100.42', type: 'Honeypot Triggered', status: 'Banned', time: '11:32:05 AM' },
  { id: 3, ip: '103.245.236.1', type: 'IDOR Resource Tamper', status: 'Blocked', time: '11:28:49 AM' },
  { id: 4, ip: '45.154.255.89', type: 'Cross-Site Scripting (XSS)', status: 'Blocked', time: '11:22:10 AM' }
];

const INITIAL_MARKERS = [
  { id: 'init-1', coords: [20.5937, 78.9629], type: 'Protected Core Gateway (Hyderabad, India)' },
  { id: 'init-2', coords: [50.1109, 8.6821], type: 'Frankfurt Decoy Honeypot Trap' }
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
      coords: [40.7128, -74.0060], // New York
      type: 'SQL Injection Blocked (192.168.1.55 - New York)'
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
      coords: [55.7558, 37.6173], // Moscow
      type: 'Honeypot Trap Triggered - IP Banned (10.0.0.12 - Moscow)'
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
      // Status filter
      if (statusFilter !== 'All' && u.status !== statusFilter) {
        return false;
      }
      // Search query filter (matches ID, name, email, IP)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = u.id.toLowerCase().includes(q);
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchIp = u.ip.toLowerCase().includes(q);
        return matchId || matchName || matchEmail || matchIp;
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

      {/* TOP SECTION: React-Leaflet Map with OSM Tiles */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Interactive OpenStreetMap Threat Canvas
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            Center: [20.5937, 78.9629] • Zoom: 4
          </span>
        </div>

        {/* Leaflet Map Container with Explicit Height */}
        <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200 relative z-10">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={4}
            scrollWheelZoom={false}
            className="h-full w-full"
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {/* Map Markers for attacks */}
            {mapMarkers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.coords}
                icon={createPulsingRedIcon(marker.type)}
              >
                <Popup>
                  <div className="text-xs font-sans font-bold text-slate-900 p-1">
                    <p className="text-rose-600 font-mono text-[10px] uppercase font-bold">Attack Coordinate</p>
                    <p className="mt-0.5">{marker.type}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Status: Mitigated & Banned</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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

      {/* BOTTOM SECTION (NEW): "Platform Users" Data Table */}
      <div id="users-table" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        {/* Section Header with Quick Stats */}
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

          {/* Quick Counter Badges */}
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

        {/* Filter & Search Bar Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by User ID, Name, Email, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter by Status Dropdown */}
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

        {/* Sleek Data Table */}
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
                      {/* User ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                          {u.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${
                              isFlagged
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-indigo-100 text-indigo-700'
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

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Account Balance */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-mono">
                          {u.balance}
                        </span>
                      </td>

                      {/* Status (Active / Flagged) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          title="Click to toggle status"
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

                      {/* Last Login IP */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span className="font-semibold">{u.ip}</span>
                        </div>
                      </td>

                      {/* Quick Actions */}
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

        {/* Footer info banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredUsers.length}</span> of{' '}
            <span className="font-bold text-slate-700">{users.length}</span> platform users
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            RBAC Access Enforcement: Admin Security Clearance Level 4
          </div>
        </div>
      </div>
    </div>
  );
};
