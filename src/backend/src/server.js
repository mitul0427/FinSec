import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import { initSocket } from './services/socketService.js';
import {
  apiRateLimiter,
  helmetMiddleware,
  checkBannedIP,
  inspectSqlInjection
} from './middleware/security.js';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import socRoutes from './routes/socRoutes.js';
import bankRoutes from './routes/bankRoutes.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';

// 1. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [ORIGIN, 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
initSocket(io);

// 2. Security Middleware & Ingress Guards
app.use(helmetMiddleware);
app.use(cors({
  origin: [ORIGIN, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Global IP Firewall & Rate Limiting
app.use(checkBannedIP);
app.use('/api', apiRateLimiter);

// Active Defense: SQL Injection Body Inspector
app.use(inspectSqlInjection);

// 3. Health Check
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'FinSec ZeroTrust Gateway',
    version: '1.0.0',
    defenseStatus: 'ACTIVE',
    timestamp: new Date().toISOString()
  });
});

// 4. Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', socRoutes); // Includes Honeypot (/api/v1/admin/login-v1) and SOC Logs
app.use('/api/admin', socRoutes); // Supports unversioned /api/admin/login-v1 honeypot directly
app.use('/api/v1/bank', bankRoutes);
app.use('/api/bank', bankRoutes); // Supports exact /api/bank/webhook/transaction path

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Resource ${req.originalUrl} not found on FinSec Gateway.`
  });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[FinSec Error Handler]', err);

  if (err.message && err.message.includes('IMMUTABLE_SECURITY_LOG_VIOLATION')) {
    return res.status(403).json({
      error: 'IMMUTABLE_LOG_ERROR',
      message: err.message
    });
  }

  res.status(err.status || 500).json({
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` FinSec ZeroTrust Gateway Initialized on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Defense Shield: RateLimit(5/s), Helmet, SQLi Filter Active`);
  console.log(` Honeypot Trap: POST /api/v1/admin/login-v1`);
  console.log(` Real-time SOC Event Bus: Socket.io Active`);
  console.log(`=======================================================`);
});

export { app, server, io };
