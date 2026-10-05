import crypto from 'crypto';

export const GENESIS_PREVIOUS_HASH = '0'.repeat(64);

/**
 * Computes a deterministic SHA-256 hash for a transaction ledger entry.
 * Normalizes amount to 2 decimal places to avoid floating-point inconsistencies.
 */
export const computeTransactionHash = ({
  ledgerIndex,
  previousHash,
  userId,
  type,
  category,
  amount,
  date,
  description,
  merchant
}) => {
  const normalizedAmount = Number(amount).toFixed(2);
  const normalizedDate = new Date(date).toISOString();
  const normalizedMerchant = merchant || '';

  const payload = [
    ledgerIndex,
    previousHash,
    userId,
    type,
    category,
    normalizedAmount,
    normalizedDate,
    description,
    normalizedMerchant
  ].join('|');

  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
};

/**
 * Computes the next ledger chaining metadata for a new transaction.
 */
export const getNextLedgerBlock = async (prismaClient, userId, txData) => {
  // Find user's latest transaction in the cryptographic chain
  const latestTx = await prismaClient.transaction.findFirst({
    where: {
      userId,
      ledgerIndex: { not: null }
    },
    orderBy: { ledgerIndex: 'desc' }
  });

  const ledgerIndex = latestTx && latestTx.ledgerIndex ? latestTx.ledgerIndex + 1 : 1;
  const previousHash = latestTx && latestTx.transactionHash ? latestTx.transactionHash : GENESIS_PREVIOUS_HASH;

  const transactionHash = computeTransactionHash({
    ledgerIndex,
    previousHash,
    userId,
    type: txData.type,
    category: txData.category,
    amount: txData.amount,
    date: txData.date,
    description: txData.description,
    merchant: txData.merchant
  });

  return {
    ledgerIndex,
    previousHash,
    transactionHash
  };
};

/**
 * Verifies the complete cryptographic transaction ledger for a user.
 * STRICTLY READ-ONLY: Never modifies, repairs, or self-heals records.
 */
export const verifyUserLedger = async (prismaClient, userId) => {
  const transactions = await prismaClient.transaction.findMany({
    where: { userId },
    orderBy: [{ ledgerIndex: 'asc' }, { createdAt: 'asc' }]
  });

  if (transactions.length === 0) {
    return {
      valid: true,
      checkedTransactions: 0,
      headHash: null,
      message: 'Ledger integrity verified'
    };
  }

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    // 1. Check for missing ledger hashes (unhashed / broken record)
    if (tx.ledgerIndex == null || !tx.previousHash || !tx.transactionHash) {
      return {
        valid: false,
        brokenAt: tx.id,
        ledgerIndex: tx.ledgerIndex || null,
        reason: 'MISSING_LEDGER_HASH',
        message: 'Ledger integrity violation detected'
      };
    }

    // 2. Check strict sequential ordering (1, 2, 3...)
    if (tx.ledgerIndex !== i + 1) {
      return {
        valid: false,
        brokenAt: tx.id,
        ledgerIndex: tx.ledgerIndex,
        expectedIndex: i + 1,
        reason: 'LEDGER_INDEX_OUT_OF_SEQUENCE',
        message: 'Ledger integrity violation detected'
      };
    }

    // 3. Verify previousHash linkage
    const expectedPrevHash = i === 0 ? GENESIS_PREVIOUS_HASH : transactions[i - 1].transactionHash;
    if (tx.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAt: tx.id,
        ledgerIndex: tx.ledgerIndex,
        reason: 'BROKEN_PREVIOUS_HASH',
        message: 'Ledger integrity violation detected'
      };
    }

    // 4. Verify transactionHash integrity against raw data
    const expectedHash = computeTransactionHash(tx);
    if (tx.transactionHash !== expectedHash) {
      return {
        valid: false,
        brokenAt: tx.id,
        ledgerIndex: tx.ledgerIndex,
        reason: 'TRANSACTION_PAYLOAD_TAMPERED',
        message: 'Ledger integrity violation detected'
      };
    }
  }

  return {
    valid: true,
    checkedTransactions: transactions.length,
    headHash: transactions[transactions.length - 1].transactionHash,
    message: 'Ledger integrity verified'
  };
};

/**
 * ONE-TIME migration utility: backfills legacy unhashed transactions before ledger is active.
 * Only call during startup migration or build script, NEVER during verification.
 */
export const backfillLegacyTransactions = async (prismaClient) => {
  const users = await prismaClient.user.findMany({
    select: { id: true }
  });

  let totalBackfilled = 0;

  for (const user of users) {
    const unchained = await prismaClient.transaction.findMany({
      where: {
        userId: user.id,
        ledgerIndex: null
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }]
    });

    if (unchained.length === 0) continue;

    // Check if user already has an existing chained head
    let latestChained = await prismaClient.transaction.findFirst({
      where: {
        userId: user.id,
        ledgerIndex: { not: null }
      },
      orderBy: { ledgerIndex: 'desc' }
    });

    let currentIndex = latestChained && latestChained.ledgerIndex ? latestChained.ledgerIndex : 0;
    let currentHash = latestChained && latestChained.transactionHash ? latestChained.transactionHash : GENESIS_PREVIOUS_HASH;

    for (const tx of unchained) {
      currentIndex += 1;
      const prevHash = currentHash;
      const hash = computeTransactionHash({
        ledgerIndex: currentIndex,
        previousHash: prevHash,
        userId: tx.userId,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        description: tx.description,
        merchant: tx.merchant
      });

      await prismaClient.transaction.update({
        where: { id: tx.id },
        data: {
          ledgerIndex: currentIndex,
          previousHash: prevHash,
          transactionHash: hash
        }
      });

      currentHash = hash;
      totalBackfilled += 1;
    }
  }

  return totalBackfilled;
};
