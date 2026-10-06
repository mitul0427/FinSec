import React, { useState } from 'react';
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
  AlertTriangle
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

export const AdminSocPage = () => {
  const [threatLogs, setThreatLogs] = useState(INITIAL_LOGS);
  const [mapMarkers, setMapMarkers] = useState(INITIAL_MARKERS);
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

  return (
    <div className="space-y-6 relative">
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
              Live Threat Radar
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Admin SOC Live Threat Map & Ingress Controls
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

      {/* TASK 1: React-Leaflet Map with OSM Tiles */}
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

      {/* TASK 3: Security Logs Table mapping over threatLogs */}
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
    </div>
  );
};
