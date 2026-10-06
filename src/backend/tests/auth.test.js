import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/prisma.js';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api/v1/auth';

describe('Auth Registration Role Security', () => {
  after(async () => {
    // Cleanup created test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['attacker_admin_attempt@audit.com', 'standard_user@audit.com']
        }
      }
    });
    await prisma.$disconnect();
  });

  test('Public registration with role: "ADMIN" must NOT escalate and must assign role: "USER"', async () => {
    const payload = {
      email: 'attacker_admin_attempt@audit.com',
      password: 'AttackerSecret123!',
      fullName: 'Attacker Attempting Escalation',
      role: 'ADMIN' // Malicious client attempt to register as ADMIN
    };

    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201, 'Registration should succeed');
    const data = await res.json();

    // 1. Check API response role
    assert.equal(
      data.user.role,
      'USER',
      'API response must strictly report role USER regardless of client payload'
    );

    // 2. Check Database record directly
    const dbUser = await prisma.user.findUnique({
      where: { email: payload.email }
    });
    assert.ok(dbUser, 'User must exist in database');
    assert.equal(
      dbUser.role,
      'USER',
      'Database record must strictly have role USER'
    );
  });

  test('Standard registration defaults to role: "USER"', async () => {
    // Small delay to respect 5 req/sec gateway rate limit
    await new Promise((r) => setTimeout(r, 250));

    const payload = {
      email: 'standard_user@audit.com',
      password: 'StandardPassword123!',
      fullName: 'Standard User'
    };

    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201, 'Registration should succeed');
    const data = await res.json();
    assert.equal(data.user.role, 'USER', 'Standard user must have role USER');

    const dbUser = await prisma.user.findUnique({
      where: { email: payload.email }
    });
    assert.equal(dbUser.role, 'USER', 'Database record must have role USER');
  });
});
