import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/prisma.js';
import { verifyUserLedger, backfillLegacyTransactions } from '../src/services/ledgerService.js';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api/v1';

describe('Cryptographic Financial Ledger Integrity & Tamper Detection', () => {
  let authToken;
  let testUserId;
  const createdTxIds = [];

  before(async () => {
    // Register test user
    const testEmail = 'ledger_test_user@audit.com';
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'LedgerPassword123!',
        fullName: 'Ledger Audit Tester'
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
          password: 'LedgerPassword123!'
        })
      });
      const data = await loginRes.json();
      authToken = data.accessToken;
      testUserId = data.user.id;
    }
  });

  after(async () => {
    if (testUserId) {
      await prisma.transaction.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  test('Valid cryptographic ledger chain: verified successfully', async () => {
    await new Promise((r) => setTimeout(r, 250));

    // Create 3 sequentially chained transactions
    for (let i = 1; i <= 3; i++) {
      await new Promise((r) => setTimeout(r, 250));
      const res = await fetch(`${BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'EXPENSE',
          category: 'Food & Dining',
          amount: 10.00 * i,
          description: `Chained Expense Block #${i}`
        })
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      createdTxIds.push(data.transaction.id);
      assert.equal(data.transaction.ledgerIndex, i);
      assert.ok(data.transaction.transactionHash, 'Must have transactionHash');
      assert.ok(data.transaction.previousHash, 'Must have previousHash');
    }

    // Call Read-Only Ledger Verification endpoint
    await new Promise((r) => setTimeout(r, 250));
    const verifyRes = await fetch(`${BASE_URL}/transactions/ledger/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.valid, true, 'Valid chain must pass verification');
    assert.equal(verifyData.checkedTransactions, 3, 'Must have checked all 3 blocks');
    assert.equal(verifyData.message, 'Ledger integrity verified');
  });

  test('Modified transaction detection: tampering with transaction payload invalidates chain', async () => {
    await new Promise((r) => setTimeout(r, 250));

    // Directly alter amount of transaction #2 in database (simulating unauthorized database tampering)
    const targetTxId = createdTxIds[1];
    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { amount: 9999.99 } // Tampered amount without updating cryptographic hash
    });

    // Call Read-Only Ledger Verification endpoint
    const verifyRes = await fetch(`${BASE_URL}/transactions/ledger/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.valid, false, 'Tampered transaction must be caught');
    assert.equal(verifyData.brokenAt, targetTxId, 'Must point to tampered transaction');
    assert.equal(verifyData.message, 'Ledger integrity violation detected');

    // Restore original amount for next test
    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { amount: 20.00 }
    });
  });

  test('Broken previousHash detection: tampering with chain link pointer invalidates chain', async () => {
    await new Promise((r) => setTimeout(r, 250));

    // Directly alter previousHash of transaction #3 in database (simulating chain link corruption)
    const targetTxId = createdTxIds[2];
    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { previousHash: 'f'.repeat(64) } // Broken pointer
    });

    // Call Read-Only Ledger Verification endpoint
    const verifyRes = await fetch(`${BASE_URL}/transactions/ledger/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.valid, false, 'Corrupted previousHash pointer must be caught');
    assert.equal(verifyData.brokenAt, targetTxId, 'Must identify broken block');
    assert.equal(verifyData.reason, 'BROKEN_PREVIOUS_HASH');
    assert.equal(verifyData.message, 'Ledger integrity violation detected');

    // Restore original previousHash for next test
    const tx2 = await prisma.transaction.findUnique({ where: { id: createdTxIds[1] } });
    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { previousHash: tx2.transactionHash }
    });
  });

  test('Missing hash detection: unhashed transaction fails verification cleanly', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const targetTxId = createdTxIds[2];
    const orig = await prisma.transaction.findUnique({ where: { id: targetTxId } });

    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { transactionHash: null }
    });

    const verifyRes = await fetch(`${BASE_URL}/transactions/ledger/verify`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.valid, false);
    assert.equal(verifyData.reason, 'MISSING_LEDGER_HASH');

    // Restore
    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { transactionHash: orig.transactionHash }
    });
  });

  test('Out-of-sequence index detection: gap in ledger index is detected', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const targetTxId = createdTxIds[2];

    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { ledgerIndex: 99 }
    });

    const verifyRes = await fetch(`${BASE_URL}/transactions/ledger/verify`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.valid, false);
    assert.equal(verifyData.reason, 'LEDGER_INDEX_OUT_OF_SEQUENCE');

    // Restore
    await prisma.transaction.update({
      where: { id: targetTxId },
      data: { ledgerIndex: 3 }
    });
  });

  test('Ledger immutability: PUT and DELETE reject mutations of chained records with 409', async () => {
    await new Promise((r) => setTimeout(r, 250));
    const targetTxId = createdTxIds[0];

    // Attempt PUT
    const putRes = await fetch(`${BASE_URL}/transactions/${targetTxId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ amount: 999.00 })
    });
    assert.equal(putRes.status, 409, 'Direct PUT on chained record must return 409');
    const putData = await putRes.json();
    assert.equal(putData.code, 'LEDGER_RECORD_IMMUTABLE');

    // Attempt DELETE
    const delRes = await fetch(`${BASE_URL}/transactions/${targetTxId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(delRes.status, 409, 'Direct DELETE on chained record must return 409');
    const delData = await delRes.json();
    assert.equal(delData.code, 'LEDGER_RECORD_IMMUTABLE');
  });

  test('Empty ledger: user with 0 transactions verifies with valid: true, count: 0', async () => {
    await new Promise((r) => setTimeout(r, 250));
    // Register separate brand-new empty user
    const emptyEmail = `empty_${Date.now()}@audit.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emptyEmail,
        password: 'Password123!',
        fullName: 'Empty User'
      })
    });
    const regData = await regRes.json();
    const emptyToken = regData.accessToken;

    const verifyRes = await fetch(`${BASE_URL}/transactions/ledger/verify`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${emptyToken}` }
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.valid, true);
    assert.equal(verifyData.checkedTransactions, 0);

    // Cleanup empty user
    await prisma.user.delete({ where: { id: regData.user.id } });
  });

  test('Legacy transaction backfill: unchained transactions get properly hashed and verified', async () => {
    const legacyEmail = `legacy_${Date.now()}@audit.com`;
    const legacyUser = await prisma.user.create({
      data: {
        email: legacyEmail,
        passwordHash: 'dummy',
        fullName: 'Legacy User',
        role: 'USER'
      }
    });

    // Create 2 unchained transactions directly in database
    await prisma.transaction.create({
      data: {
        userId: legacyUser.id,
        type: 'INCOME',
        category: 'Salary',
        amount: 1000,
        description: 'Legacy unchained 1',
        date: new Date('2026-10-01T00:00:00Z')
      }
    });
    await prisma.transaction.create({
      data: {
        userId: legacyUser.id,
        type: 'EXPENSE',
        category: 'Food & Dining',
        amount: 50,
        description: 'Legacy unchained 2',
        date: new Date('2026-10-02T00:00:00Z')
      }
    });

    // Verify initially fails due to missing hashes
    const initialVerify = await verifyUserLedger(prisma, legacyUser.id);
    assert.equal(initialVerify.valid, false);
    assert.equal(initialVerify.reason, 'MISSING_LEDGER_HASH');

    // Run backfill utility
    const count = await backfillLegacyTransactions(prisma);
    assert.ok(count >= 2);

    // Verify now passes!
    const postVerify = await verifyUserLedger(prisma, legacyUser.id);
    assert.equal(postVerify.valid, true);
    assert.equal(postVerify.checkedTransactions, 2);

    // Cleanup
    await prisma.transaction.deleteMany({ where: { userId: legacyUser.id } });
    await prisma.user.delete({ where: { id: legacyUser.id } });
  });
});
