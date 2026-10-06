import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import prisma from '../src/config/prisma.js';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api/v1';
const HMAC_SECRET = process.env.HMAC_SECRET || 'finsec_hmac_request_signing_secret_key_2026_default';

describe('HMAC Signature Verification & Tamper Resistance', () => {
  let authToken;
  let testUserId;

  before(async () => {
    // Register or login a test user to obtain Bearer auth token
    const testEmail = 'hmac_test_user@audit.com';
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'HmacTestPassword123!',
        fullName: 'HMAC Test User'
      })
    });

    if (regRes.status === 201) {
      const data = await regRes.json();
      authToken = data.accessToken;
      testUserId = data.user.id;
    } else {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'HmacTestPassword123!'
        })
      });
      const data = await loginRes.json();
      authToken = data.accessToken;
      testUserId = data.user.id;
    }
  });

  after(async () => {
    // Cleanup created test transactions & user
    if (testUserId) {
      await prisma.transaction.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  test('Valid HMAC signature: allowed and processed successfully', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const timestamp = Date.now().toString();
    const body = {
      type: 'EXPENSE',
      category: 'Food & Dining',
      amount: 45.00,
      description: 'HMAC Valid Dinner'
    };

    const payload = `${timestamp}.${JSON.stringify(body)}`;
    const validSignature = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');

    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-hmac-signature': validSignature,
        'x-hmac-timestamp': timestamp
      },
      body: JSON.stringify(body)
    });

    assert.equal(res.status, 201, 'Valid HMAC signature must be accepted');
    const data = await res.json();
    assert.equal(data.transaction.description, 'HMAC Valid Dinner');
  });

  test('Invalid same-length HMAC signature: rejected with 401 HMAC_SIGNATURE_INVALID', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const timestamp = Date.now().toString();
    const body = {
      type: 'EXPENSE',
      category: 'Food & Dining',
      amount: 15.00,
      description: 'HMAC Same-Length Tampered'
    };

    // 64-character hex string (same length as sha256 hex digest, but corrupted)
    const forgedSameLengthSig = 'a'.repeat(64);

    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-hmac-signature': forgedSameLengthSig,
        'x-hmac-timestamp': timestamp
      },
      body: JSON.stringify(body)
    });

    assert.equal(res.status, 401, 'Tampered same-length signature must return 401');
    const data = await res.json();
    assert.equal(data.error, 'HMAC_SIGNATURE_INVALID');
  });

  test('Invalid different-length HMAC signature: cleanly rejected with 401 (not 500)', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const timestamp = Date.now().toString();
    const body = {
      type: 'EXPENSE',
      category: 'Food & Dining',
      amount: 15.00,
      description: 'HMAC Different-Length Tampered'
    };

    // Arbitrary length different from 64 (would previously trigger RangeError in timingSafeEqual)
    const forgedShortSig = 'bad_sig_123';

    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-hmac-signature': forgedShortSig,
        'x-hmac-timestamp': timestamp
      },
      body: JSON.stringify(body)
    });

    assert.notEqual(res.status, 500, 'Must not crash with HTTP 500 RangeError');
    assert.equal(res.status, 401, 'Malformed different-length signature must return 401');
    const data = await res.json();
    assert.equal(data.error, 'HMAC_SIGNATURE_INVALID');
  });

  test('Expired timestamp: rejected with 401 HMAC_REPLAY_ATTACK_PREVENTED', async () => {
    await new Promise((r) => setTimeout(r, 250));
    // 10 minutes in the past
    const expiredTimestamp = (Date.now() - 600000).toString();
    const body = {
      type: 'EXPENSE',
      category: 'Food & Dining',
      amount: 15.00,
      description: 'Replay Attempt'
    };

    const payload = `${expiredTimestamp}.${JSON.stringify(body)}`;
    const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');

    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-hmac-signature': signature,
        'x-hmac-timestamp': expiredTimestamp
      },
      body: JSON.stringify(body)
    });

    assert.equal(res.status, 401, 'Expired timestamp must return 401');
    const data = await res.json();
    assert.equal(data.error, 'HMAC_REPLAY_ATTACK_PREVENTED');
  });
});
