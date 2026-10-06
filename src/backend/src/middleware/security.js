import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { isIPBanned, banIP, resolveThreatGeo } from '../services/ipBanService.js';
import { broadcastSecurityAlert } from '../services/socketService.js';
import prisma from '../config/prisma.js';

// 1. Rate Limiter (5 requests per second per IP)
export const apiRateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 5,         // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'FinSec Rate Limit Exceeded (Strict 5 req/sec threshold enforced).'
  }
});

// Strict Rate Limiter for Login (Anti-Bruteforce: 5 attempts per minute)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_LOGIN_ATTEMPTS',
    message: 'Rate limit exceeded: Maximum 5 login attempts per minute allowed to protect against credential stuffing.'
  }
});

// Strict Rate Limiter for Receipt Upload (10 uploads per minute)
export const receiptRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_RECEIPT_UPLOADS',
    message: 'Rate limit exceeded: Maximum 10 receipt scans per minute.'
  }
});

// Strict Rate Limiter for Webhook Simulation (30 requests per minute)
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_WEBHOOK_CALLS',
    message: 'Rate limit exceeded: Maximum 30 bank webhook transactions per minute.'
  }
});

// 2. Helmet Security Headers with strict Content Security Policy
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

// 3. Banned IP Firewall Middleware
export const checkBannedIP = (req, res, next) => {
  const clientIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (isIPBanned(clientIP)) {
    return res.status(403).json({
      error: 'FORBIDDEN_HOST_BANNED',
      message: 'Access Denied: Your IP address has been blacklisted by FinSec Active Defense for malicious behavior.',
      ip: clientIP
    });
  }
  next();
};

// 4. SQL Injection Request Body Inspection Filter
// Patterns: UNION SELECT, ' OR '1'='1, OR 1=1, --, DROP TABLE, xp_cmdshell, etc.
const SQLI_REGEX = /(\b(UNION(\s+ALL)?\s+SELECT|SELECT\s+.*\s+FROM|INSERT\s+INTO|DELETE\s+FROM|DROP\s+TABLE|ALTER\s+TABLE|OR\s+['"]?1['"]?\s*=\s*['"]?1|--|\/\*|\*\/|WAITFOR\s+DELAY|EXEC(\s+XP_)?)\b)/i;

export const inspectSqlInjection = async (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const rawPayload = JSON.stringify(req.body);
    if (SQLI_REGEX.test(rawPayload)) {
      const clientIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const geo = resolveThreatGeo(clientIP);

      // Log threat to Immutable SecurityLog
      try {
        const securityEvent = await prisma.securityLog.create({
          data: {
            eventType: 'SQLI_ATTEMPT',
            severity: 'CRITICAL',
            ipAddress: clientIP,
            endpoint: req.originalUrl,
            payload: rawPayload.slice(0, 500),
            latitude: geo.lat,
            longitude: geo.lng,
            locationName: geo.name,
            actionTaken: 'BLOCKED'
          }
        });

        // Emit real-time alert to SOC Dashboard
        broadcastSecurityAlert({
          id: securityEvent.id,
          type: 'SQL_INJECTION_BLOCKED',
          severity: 'CRITICAL',
          ip: clientIP,
          endpoint: req.originalUrl,
          location: geo.name,
          lat: geo.lat,
          lng: geo.lng,
          timestamp: new Date().toISOString(),
          details: 'Malicious SQL keyword or tautology detected in request body.'
        });
      } catch (err) {
        console.error('Failed to log SQLi attempt:', err);
      }

      return res.status(400).json({
        error: 'MALICIOUS_PAYLOAD_DETECTED',
        message: 'FinSec Active Defense: Potential SQL Injection pattern detected and neutralized.',
        code: 'SEC_SQLI_FILTER_ACTIVE'
      });
    }
  }
  next();
};

// 5. HMAC-SHA256 Request Signature Verification Middleware
// When x-hmac-signature is provided, validates that payload has not been tampered with.
export const verifyHmacSignature = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.is('multipart/form-data')) {
    const signature = req.headers['x-hmac-signature'];
    const timestamp = req.headers['x-hmac-timestamp'];

    // If client supplied signature headers, verify cryptographic integrity
    if (signature && timestamp) {
      // Prevent replay attacks (allow 5-minute clock drift)
      const now = Date.now();
      const reqTime = parseInt(timestamp, 10);
      if (isNaN(reqTime) || Math.abs(now - reqTime) > 300000) {
        return res.status(401).json({
          error: 'HMAC_REPLAY_ATTACK_PREVENTED',
          message: 'Timestamp expired or invalid. Request signature rejected.'
        });
      }

      const secret = process.env.HMAC_SECRET || 'finsec_hmac_request_signing_secret_key_2026_default';
      const payload = `${timestamp}.${JSON.stringify(req.body || {})}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
        return res.status(401).json({
          error: 'HMAC_SIGNATURE_INVALID',
          message: 'Data tampering detected! HMAC-SHA256 signature does not match.'
        });
      }
    }
  }
  next();
};
