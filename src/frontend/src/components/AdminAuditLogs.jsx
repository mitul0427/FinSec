import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Flame,
  Zap,
  Radio
} from 'lucide-react';
import { socApi } from '../utils/api';
import { sanitizePlain } from '../utils/sanitize';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let params = '?limit=50';
      if (severityFilter) params += `&severity=${severityFilter}`;
      if (eventTypeFilter) params += `&eventType=${eventTypeFilter}`;

      const res = await socApi.logs(params);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch security audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [severityFilter, eventTypeFilter]);

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-slate-100">Immutable SOC Security Audit Trail</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center">
              <Lock className="w-3 h-3 mr-1" /> Append-Only Guaranteed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Protected by Prisma runtime middleware interceptors prohibiting all DELETE and UPDATE mutations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/40 p-4 border-b border-slate-800/60 flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Event Type:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Ingress Threats</option>
            <option value="HONEYPOT_TRIGGER">Honeypot Decoy Trap</option>
            <option value="SQLI_ATTEMPT">SQL Injection Attempt</option>
            <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded</option>
            <option value="AUTH_FAILURE">Auth Failure</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Threat Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Origin IP & Location</th>
              <th className="py-3 px-4">Target Endpoint</th>
              <th className="py-3 px-4">Payload Extract</th>
              <th className="py-3 px-4 text-center">Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  Streaming immutable audit records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No security incidents recorded.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isCritical = log.severity === 'CRITICAL';
                return (
                  <tr key={log.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-200 flex items-center">
                        {log.eventType === 'HONEYPOT_TRIGGER' ? (
                          <Flame className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                        ) : log.eventType === 'SQLI_ATTEMPT' ? (
                          <Zap className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                        )}
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-red-950 text-red-400 border-red-800/60'
                            : 'bg-amber-950 text-amber-400 border-amber-800/60'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-300 font-semibold">{log.ipAddress}</div>
                      <div className="text-[10px] text-slate-500">{log.locationName || 'Unknown Node'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <code className="text-[11px] text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {log.endpoint}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                      {sanitizePlain(log.payload || 'No body')}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {log.actionTaken}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
