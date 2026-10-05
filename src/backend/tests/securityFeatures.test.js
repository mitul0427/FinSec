import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/prisma.js';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api/v1';

describe('Security Center, Anomaly Detection & Hardened Data Export', () => {
  let authToken;
  let testUserId;

  before(async () => {
    const testEmail = `sec_feature_${Date.now()}@audit.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'FeaturePassword123!',
        fullName: 'Security Feature Tester'
      })
    });
    const regData = await regRes.json();
    authToken = regData.accessToken;
    testUserId = regData.user.id;
  });

  after(async () => {
    if (testUserId) {
      await prisma.transaction.deleteMany({ where: { userId: testUserId } });
      await prisma.budget.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  test('Security Center: returns real user telemetry, passkey status, and session details', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const res = await fetch(`${BASE_URL}/auth/security-center`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.authStatus, 'AUTHENTICATED');
    assert.equal(data.user.id, testUserId);
    assert.equal(data.user.role, 'USER');
    assert.ok(data.session.tokenIssuedAt, 'Session must include token issue timestamp');
    assert.ok(data.session.tokenExpiresAt, 'Session must include token expiration timestamp');
    assert.equal(data.passkeys.isConfigured, false, 'No passkeys registered yet');
    assert.equal(data.passkeys.registeredCount, 0);
  });

  test('Sign out all sessions: revokes refresh cookie and logs security audit event', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const res = await fetch(`${BASE_URL}/auth/logout-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.code, 'ALL_SESSIONS_REVOKED');

    const log = await prisma.securityLog.findFirst({
      where: { userId: testUserId, eventType: 'LOGOUT_ALL_SESSIONS' }
    });
    assert.ok(log, 'Must record LOGOUT_ALL_SESSIONS security event');
  });

  test('Anomaly Detection: flags high-value transaction, duplicates, and budget overruns', async () => {
    await new Promise((r) => setTimeout(r, 250));

    // Seed test transactions directly for user
    // 3 normal expenses, 1 extreme expense (> 2.5x), 2 duplicate expenses
    await prisma.transaction.createMany({
      data: [
        { userId: testUserId, type: 'EXPENSE', category: 'Food & Dining', amount: 20.00, description: 'Lunch A', date: new Date() },
        { userId: testUserId, type: 'EXPENSE', category: 'Food & Dining', amount: 25.00, description: 'Lunch B', date: new Date() },
        { userId: testUserId, type: 'EXPENSE', category: 'Food & Dining', amount: 20.00, description: 'Lunch C', date: new Date() },
        { userId: testUserId, type: 'EXPENSE', category: 'Food & Dining', amount: 1500.00, description: 'Luxury Dinner Feast', date: new Date() },
        { userId: testUserId, type: 'EXPENSE', category: 'Shopping', amount: 99.99, description: 'Software license #1', date: new Date() },
        { userId: testUserId, type: 'EXPENSE', category: 'Shopping', amount: 99.99, description: 'Software license #2', date: new Date() }
      ]
    });

    // Create a budget that is exceeded
    await prisma.budget.create({
      data: {
        userId: testUserId,
        category: 'Food & Dining',
        limitAmount: 500.00
      }
    });

    const res = await fetch(`${BASE_URL}/transactions/anomalies`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.totalAnomalies >= 2, 'Should flag multiple anomalies');

    const types = data.anomalies.map((a) => a.type);
    assert.ok(types.includes('HIGH_VALUE_EXPENSE'), 'Must detect 1500.00 spike');
    assert.ok(types.includes('POTENTIAL_DUPLICATE_CHARGE'), 'Must detect duplicate 99.99 charges');
    assert.ok(types.includes('BUDGET_EXCEEDED'), 'Must detect budget overrun (spending > 500.00)');
  });

  test('Secure Data Export: validates format and prevents CSV Formula Injection', async () => {
    await new Promise((r) => setTimeout(r, 250));

    // Seed transaction with formula injection payload e.g. "=SUM(1+1)"
    await prisma.transaction.create({
      data: {
        userId: testUserId,
        type: 'EXPENSE',
        category: 'Utilities',
        amount: 50.00,
        description: '=cmd|"/C calc"!A0', // Classic CSV formula injection attempt
        date: new Date()
      }
    });

    // 1. Invalid format rejected
    const badRes = await fetch(`${BASE_URL}/transactions/export?format=xml`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(badRes.status, 400);

    // 2. CSV format with sanitized formulas
    const csvRes = await fetch(`${BASE_URL}/transactions/export?format=csv`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(csvRes.status, 200);
    const csvText = await csvRes.text();

    // Verify formula has been neutralized with leading single quote: "'=cmd"
    assert.ok(csvText.includes("''=cmd") || csvText.includes("'=cmd"), 'Formula injection must be safely escaped with leading single-quote');

    // 3. Verify DATA_EXPORT audit log
    const exportLog = await prisma.securityLog.findFirst({
      where: { userId: testUserId, eventType: 'DATA_EXPORT' }
    });
    assert.ok(exportLog, 'Export event must be logged to SecurityLog');
  });
});
