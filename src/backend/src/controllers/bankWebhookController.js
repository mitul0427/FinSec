import prisma from '../config/prisma.js';
import { broadcastSuspiciousTransaction, broadcastSecurityAlert } from '../services/socketService.js';
import { banIP, resolveThreatGeo } from '../services/ipBanService.js';

// Anomaly Engine: Evaluates simulated bank transactions
export const evaluateTransactionAnomaly = async ({ userId, amount, category, location, timestamp }) => {
  const anomalies = [];

  // Rule 1: Check 30-day average for that category (>3x average)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const pastTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      category,
      type: 'EXPENSE',
      status: 'COMPLETED',
      date: { gte: thirtyDaysAgo }
    }
  });

  if (pastTransactions.length > 0) {
    const total = pastTransactions.reduce((acc, t) => acc + t.amount, 0);
    const avg = total / pastTransactions.length;
    if (amount > avg * 3) {
      anomalies.push(`Amount ($${amount}) is >3x user 30-day average ($${avg.toFixed(2)}) for category '${category}'`);
    }
  } else {
    // If no past transactions in this category but amount is exceptionally large (> 500)
    if (amount > 1000) {
      anomalies.push(`First-time large transaction of $${amount} in category '${category}'`);
    }
  }

  // Rule 2: Geographically impossible location check
  // Baseline assumption: User is based in India / Hyderabad.
  // Flag impossible / high-risk regions: Russia, North Korea, unknown foreign regions without prior presence
  const highRiskLocations = ['Russia', 'Moscow', 'St. Petersburg', 'Pyongyang', 'North Korea', 'Nigeria', 'Lagos'];
  const userBaseCity = 'Hyderabad';

  if (location) {
    const isImpossible = highRiskLocations.some(loc => location.toLowerCase().includes(loc.toLowerCase()));
    if (isImpossible) {
      anomalies.push(`Geographically impossible location: User primary base is ${userBaseCity}, transaction attempted from '${location}'`);
    }
  }

  return {
    isAnomalous: anomalies.length > 0,
    reasons: anomalies
  };
};

// 1. Bank Webhook Ingress (POST /api/bank/webhook/transaction)
export const handleBankWebhookTransaction = async (req, res) => {
  try {
    const {
      userId,
      amount,
      merchant,
      location = 'Unknown Location',
      category = 'Shopping',
      timestamp = new Date().toISOString()
    } = req.body;

    if (!amount || !merchant) {
      return res.status(400).json({ error: 'amount and merchant are required fields.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount required.' });
    }

    // Determine target user
    let targetUserId = userId;
    if (!targetUserId && req.user) {
      targetUserId = req.user.id;
    }

    if (!targetUserId) {
      // Pick first user or demo user
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        targetUserId = firstUser.id;
      } else {
        return res.status(400).json({ error: 'No user found in database for transaction simulation.' });
      }
    }

    // Evaluate Anomaly
    const anomalyCheck = await evaluateTransactionAnomaly({
      userId: targetUserId,
      amount: numAmount,
      category,
      location,
      timestamp
    });

    const status = anomalyCheck.isAnomalous ? 'PENDING_CONFIRMATION' : 'COMPLETED';

    const transaction = await prisma.transaction.create({
      data: {
        userId: targetUserId,
        type: 'EXPENSE',
        category,
        amount: numAmount,
        date: new Date(timestamp),
        description: `Bank Sync: ${merchant} (${location})`,
        merchant,
        status,
        location
      }
    });

    // If flagged: Emit Socket.io event: "Suspicious transaction detected. Please confirm."
    if (anomalyCheck.isAnomalous) {
      broadcastSuspiciousTransaction(transaction, anomalyCheck.reasons.join('; '));
    }

    return res.status(201).json({
      message: anomalyCheck.isAnomalous
        ? 'Suspicious transaction detected. Transaction placed on hold (PENDING_CONFIRMATION).'
        : 'Bank transaction processed successfully.',
      status,
      anomalyCheck,
      transaction
    });
  } catch (err) {
    console.error('handleBankWebhookTransaction error:', err);
    return res.status(500).json({ error: 'Failed to process bank webhook transaction.' });
  }
};

// 2. User Decision: Approve (POST /api/bank/transaction/:id/approve)
export const approveTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (transaction.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'FORBIDDEN_IDOR_VIOLATION', message: 'Not authorized for this transaction.' });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });

    return res.json({
      message: 'Transaction approved. Status updated to COMPLETED.',
      transaction: updated
    });
  } catch (err) {
    console.error('approveTransaction error:', err);
    return res.status(500).json({ error: 'Failed to approve transaction.' });
  }
};

// 3. User Decision: Block (POST /api/bank/transaction/:id/block)
export const blockTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '185.220.101.99';
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (transaction.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'FORBIDDEN_IDOR_VIOLATION', message: 'Not authorized for this transaction.' });
    }

    // Update status to BLOCKED
    const updated = await prisma.transaction.update({
      where: { id },
      data: { status: 'BLOCKED' }
    });

    // Log to Immutable SecurityLog
    const geo = resolveThreatGeo(clientIP);
    const secLog = await prisma.securityLog.create({
      data: {
        eventType: 'FRAUDULENT_TX_BLOCKED',
        severity: 'CRITICAL',
        ipAddress: clientIP,
        endpoint: `/api/bank/transaction/${id}/block`,
        payload: JSON.stringify({
          transactionId: id,
          amount: transaction.amount,
          merchant: transaction.merchant,
          location: transaction.location
        }),
        userId: req.user.id,
        latitude: geo.lat,
        longitude: geo.lng,
        locationName: transaction.location || geo.name,
        actionTaken: 'BLOCKED'
      }
    });

    // Trigger Honeypot alert
    broadcastSecurityAlert({
      id: secLog.id,
      type: 'BANK_ANOMALY_HONEYPOT_ALERT',
      severity: 'CRITICAL',
      ip: clientIP,
      endpoint: '/api/bank/webhook/transaction',
      location: transaction.location || geo.name,
      lat: geo.lat,
      lng: geo.lng,
      timestamp: new Date().toISOString(),
      action: 'TRANSACTION_BLOCKED_AND_ISOLATED',
      details: `User blocked suspicious bank transaction from ${transaction.merchant} (${transaction.location}) for $${transaction.amount}. Honeypot tripwire armed.`
    });

    return res.json({
      message: 'Transaction blocked and flagged as fraudulent. Security log updated and honeypot alert triggered.',
      transaction: updated,
      securityLogId: secLog.id
    });
  } catch (err) {
    console.error('blockTransaction error:', err);
    return res.status(500).json({ error: 'Failed to block transaction.' });
  }
};
