import prisma from '../config/prisma.js';
import { getBannedIPsList, banIP, resolveThreatGeo } from '../services/ipBanService.js';
import { broadcastSecurityAlert } from '../services/socketService.js';

// 1. Get Immutable Security Audit Logs (Admin only)
export const getSecurityLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0, eventType, severity } = req.query;
    const where = {};

    if (eventType) where.eventType = String(eventType);
    if (severity) where.severity = String(severity);

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.securityLog.count({ where })
    ]);

    return res.json({
      logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err) {
    console.error('getSecurityLogs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve security logs.' });
  }
};

// 2. Get SOC Threat Statistics & Active Banned IPs
export const getSocStats = async (req, res) => {
  try {
    const [totalAttacks, honeypotTriggers, sqliAttempts, criticalEvents] = await Promise.all([
      prisma.securityLog.count(),
      prisma.securityLog.count({ where: { eventType: 'HONEYPOT_TRIGGER' } }),
      prisma.securityLog.count({ where: { eventType: 'SQLI_ATTEMPT' } }),
      prisma.securityLog.count({ where: { severity: 'CRITICAL' } })
    ]);

    const bannedIPs = getBannedIPsList();

    const recentThreats = await prisma.securityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 15
    });

    return res.json({
      totalAttacks,
      honeypotTriggers,
      sqliAttempts,
      criticalEvents,
      bannedCount: bannedIPs.length,
      bannedIPs,
      recentThreats
    });
  } catch (err) {
    console.error('getSocStats error:', err);
    return res.status(500).json({ error: 'Failed to compute SOC statistics.' });
  }
};

// 3. Honeypot Decoy Handler (POST /api/v1/admin/login-v1)
export const handleHoneypot = async (req, res) => {
  try {
    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '198.51.100.42';
    const geo = resolveThreatGeo(clientIP);
    const payload = JSON.stringify(req.body || {}).slice(0, 500);

    // 1. Immediately Ban IP
    banIP(clientIP, 'Accessed decoy Honeypot route /api/v1/admin/login-v1', 24 * 60 * 60 * 1000);

    // 2. Log to Immutable SecurityLog table
    const securityEntry = await prisma.securityLog.create({
      data: {
        eventType: 'HONEYPOT_TRIGGER',
        severity: 'CRITICAL',
        ipAddress: clientIP,
        endpoint: '/api/v1/admin/login-v1',
        payload,
        latitude: geo.lat,
        longitude: geo.lng,
        locationName: geo.name,
        actionTaken: 'BANNED'
      }
    });

    // 3. Emit Real-time Socket.io Threat Alert to SOC Dashboard
    broadcastSecurityAlert({
      id: securityEntry.id,
      type: 'HONEYPOT_TRAP_TRIGGERED',
      severity: 'CRITICAL',
      ip: clientIP,
      endpoint: '/api/v1/admin/login-v1',
      location: geo.name,
      lat: geo.lat,
      lng: geo.lng,
      timestamp: new Date().toISOString(),
      action: 'HOST_INSTANTLY_BANNED',
      details: 'Unauthorized entity attempted to probe legacy decoy authentication route.'
    });

    // Return misleading decoy response to slow down attacker enumeration
    return res.status(401).json({
      error: 'Invalid Credentials',
      code: 'AUTH_FAILED_LEGACY_GATEWAY'
    });
  } catch (err) {
    console.error('Honeypot error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// 4. Test Attack Simulator Endpoint (Allows testing live SOC alerts on demand)
export const simulateAttack = async (req, res) => {
  try {
    const { type = 'SQLI_ATTEMPT', ip = '185.220.101.5' } = req.body;
    const geo = resolveThreatGeo(ip);

    const actionTaken = type === 'HONEYPOT_TRIGGER' ? 'BANNED' : 'BLOCKED';

    const log = await prisma.securityLog.create({
      data: {
        eventType: type,
        severity: type === 'HONEYPOT_TRIGGER' ? 'CRITICAL' : 'HIGH',
        ipAddress: ip,
        endpoint: type === 'HONEYPOT_TRIGGER' ? '/api/v1/admin/login-v1' : '/api/v1/transactions',
        payload: type === 'SQLI_ATTEMPT' ? "{ query: \"' UNION SELECT * FROM users --\" }" : "{ username: \"admin\", password: \"admin123\" }",
        latitude: geo.lat,
        longitude: geo.lng,
        locationName: geo.name,
        actionTaken
      }
    });

    if (type === 'HONEYPOT_TRIGGER') {
      banIP(ip, 'Controlled security test: simulated adversary probed decoy honeypot', 24 * 60 * 60 * 1000);
    }

    broadcastSecurityAlert({
      id: log.id,
      type: type === 'HONEYPOT_TRIGGER' ? 'HONEYPOT_TRAP_TRIGGERED' : 'SQL_INJECTION_BLOCKED',
      severity: log.severity,
      ip,
      endpoint: log.endpoint,
      location: geo.name,
      lat: geo.lat,
      lng: geo.lng,
      timestamp: new Date().toISOString(),
      action: actionTaken,
      details: type === 'HONEYPOT_TRIGGER' ? 'Controlled security test: simulated adversary probed decoy honeypot route.' : 'Simulated ingress attack blocked.'
    });

    return res.json({ message: 'Simulated attack logged and broadcast to SOC.', log });
  } catch (err) {
    return res.status(500).json({ error: 'Simulation failed.', details: err.message });
  }
};
